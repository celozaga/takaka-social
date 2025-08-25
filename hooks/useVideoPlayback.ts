import { useState, useEffect } from 'react';
import { useAtp } from '@/context/AtpContext';
import { AppBskyEmbedVideo } from '@atproto/api';
import type { ContentType } from 'expo-video';

// URLs corretas do Bluesky baseadas na análise do skytube.video
const BSKY_VIDEO_BASE = 'https://video.bsky.app/watch';
const BSKY_CDN_BASE = 'https://video.cdn.bsky.app/hls';

/**
 * Testa se uma URL HLS está disponível fazendo uma requisição GET com timeout
 * e verificando se o conteúdo é realmente um stream HLS válido
 */
const testHlsAvailability = async (url: string): Promise<boolean> => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
        
        console.log('🔍 Testing HLS URL:', url);
        
        const response = await fetch(url, { 
            method: 'GET',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            console.log('❌ HLS URL test failed - HTTP status:', response.status, url);
            return false;
        }
        
        // Para URLs .m3u8, vamos verificar se o conteúdo é realmente uma playlist HLS
        if (url.includes('.m3u8')) {
            const text = await response.text();
            console.log('🔍 HLS playlist content preview:', text.substring(0, 200));
            
            const isHlsPlaylist = text.includes('#EXTM3U') || text.includes('#EXTINF');
            if (!isHlsPlaylist) {
                console.log('❌ HLS playlist test failed - invalid content:', url);
                return false;
            }
            console.log('✅ HLS playlist test passed:', url);
            return true;
        }
        
        // Para URLs .ts, vamos verificar se o conteúdo é um segmento de vídeo
        if (url.includes('.ts')) {
            const contentType = response.headers.get('content-type');
            const contentLength = response.headers.get('content-length');
            console.log('🔍 HLS segment headers:', { contentType, contentLength });
            
            if (contentType && contentType.includes('video/')) {
                console.log('✅ HLS segment test passed:', url);
                return true;
            }
            console.log('❌ HLS segment test failed - invalid content type:', contentType, url);
            return false;
        }
        
        // Para outras URLs, apenas verificar se a resposta é OK
        console.log('✅ HLS URL test passed (generic):', url);
        return true;
        
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.log('⏰ HLS URL test timeout:', url);
        } else {
            console.log('❌ HLS URL test failed:', url, error);
        }
        return false;
    }
};

/**
 * Resolves video playback URLs for a given post, providing both a primary HLS URL
 * and a fallback MP4 URL from the getBlob endpoint.
 * 
 * Priority order:
 * 1. HLS Playlist URL (highest quality available)
 * 2. HLS Direct URL (specific quality)
 * 3. Streaming URL (MP4 with Range support)
 * 4. Fallback URL (basic MP4)
 */
export const useVideoPlayback = (embed: AppBskyEmbedVideo.View | undefined, authorDid: string | undefined) => {
    console.log('🔍 useVideoPlayback: init', { embedCid: embed?.cid, authorDid });

    console.log('🔍 useVideoPlayback: atp');
    const { agent } = useAtp();
    console.log('🔍 useVideoPlayback: useAtp() called successfully, agent:', !!agent);
    
    console.log('🔍 useVideoPlayback: state');
    const [playbackUrls, setPlaybackUrls] = useState<{ 
        hlsUrl: string | null; 
        hlsPlaylistUrl: string | null; // URL para playlist.m3u8
        hlsDirectUrl: string | null;   // URL direta para .ts
        fallbackUrl: string | null;
        streamingUrl: string | null;
        preferredUrl: string | null; // The URL that should be used first
        contentType: ContentType; // Content type for expo-video
        isLoading: boolean;
    }>({ 
        hlsUrl: null, 
        hlsPlaylistUrl: null,
        hlsDirectUrl: null,
        fallbackUrl: null, 
        streamingUrl: null, 
        preferredUrl: null,
        contentType: 'auto',
        isLoading: true 
    });
    console.log('🔍 useVideoPlayback: useState called successfully');
    
    console.log('🔍 useVideoPlayback: error state');
    const [error, setError] = useState<string | null>(null);
    console.log('🔍 useVideoPlayback: useState for error called successfully');
    
    console.log('🔍 useVideoPlayback: About to define useEffect');
    useEffect(() => {
        console.log('🔍 useVideoPlayback: effect', { embed: !!embed, authorDid });
        
        const resolveUrls = async () => {
            console.log('🔍 useVideoPlayback: resolve');
            
            setPlaybackUrls(prev => ({ 
                ...prev,
                isLoading: true 
            }));
            setError(null);

            if (!embed || !authorDid || !agent?.service) {
                console.log('❌ missing data', { hasEmbed: !!embed, authorDid });
                setPlaybackUrls(prev => ({ 
                    ...prev,
                    isLoading: false 
                }));
                return;
            }
            
            console.log('🔍 resolve: has playlist?', !!embed.playlist);
            
            try {
                // 🔍 NOVA ABORDAGEM: Usar embed.playlist diretamente como o Bluesky oficial
                if (embed.playlist) {
                    console.log('✅ playlist', embed.playlist);
                    
                    // Se temos embed.playlist, usar diretamente como HLS
                    const hlsPlaylistUrl = embed.playlist;
                    let preferredUrl = hlsPlaylistUrl;
                    let contentType: ContentType = 'hls';
                    
                    // Ainda assim, preparar URLs de fallback MP4 (desativados se o flag estiver ativo)
                    const serviceUrl = agent.service.toString();
                    const baseUrl = serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`;
                    const computedFallbackUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${embed.cid}`;
                    const computedStreamingUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${embed.cid}&streaming=true`;
                    const fallbackUrl = null; // fallback MP4 removido
                    const streamingUrl = null; // fallback MP4 removido
                    
                    // Preferir master playlist como no app oficial; não trocar para sub-playlist durante o teste
                    // (Se necessário, podemos reativar a seleção de sub-playlist depois dos testes)

                    console.log('🎯 use HLS', { preferredUrl });
                    
                    setPlaybackUrls({ 
                        hlsUrl: hlsPlaylistUrl, 
                        hlsPlaylistUrl,
                        hlsDirectUrl: null,
                        fallbackUrl, 
                        streamingUrl, 
                        preferredUrl,
                        contentType,
                        isLoading: false 
                    });
                    console.log('🔍 set urls');
                    return;
                } else {
                    console.log('⚠️ embed.playlist is falsy, checking why...');
                    console.log('⚠️ embed.playlist === null:', embed.playlist === null);
                    console.log('⚠️ embed.playlist === undefined:', embed.playlist === undefined);
                    console.log('⚠️ embed.playlist === "":', embed.playlist === "");
                }
                
                // 🔍 FALLBACK: Se não temos embed.playlist, usar nossa lógica anterior
                console.log('⚠️ no playlist, manual URLs');
                
                // 1. Construct HLS URLs (preferred methods)
                // Baseado nos exemplos REAIS do skytube.video que funcionam:
                // https://video.bsky.app/watch/did%3Aplc%3Agunx7ih6iezi3biuqg6vy6l5/bafkreih4vda6gxh6egjqybdcwdkxh2ezy46qdmrzy/playlist.m3u8
                // https://video.cdn.bsky.app/hls/did:plc:gpunjjgvlyb4racypz3yfiq4/bafkreicwdprg4zwwxilotxc2pvtzj7ko32cglois55nwonhuvvujhb3zpu/720p/video1.ts
                
                // Playlist completa - usar formato EXATO do Bluesky
                const hlsPlaylistUrl = `${BSKY_VIDEO_BASE}/${encodeURIComponent(authorDid)}/${embed.cid}/playlist.m3u8`;
                
                // URLs diretas para diferentes qualidades - usar formato EXATO do CDN
                const hlsDirectUrls = [
                    `${BSKY_CDN_BASE}/${authorDid}/${embed.cid}/720p/video1.ts`,
                    `${BSKY_CDN_BASE}/${authorDid}/${embed.cid}/480p/video1.ts`,
                    `${BSKY_CDN_BASE}/${authorDid}/${embed.cid}/360p/video1.ts`
                ];
                
                // URLs alternativas baseadas no SkyTube - tentar diferentes formatos
                const alternativeHlsUrls = [
                    // Formato alternativo 1: sem encodeURIComponent
                    `${BSKY_VIDEO_BASE}/${authorDid}/${embed.cid}/playlist.m3u8`,
                    // Formato alternativo 2: com diferentes qualidades
                    `${BSKY_VIDEO_BASE}/${encodeURIComponent(authorDid)}/${embed.cid}/720p/video.m3u8`,
                    `${BSKY_VIDEO_BASE}/${encodeURIComponent(authorDid)}/${embed.cid}/480p/video.m3u8`,
                    `${BSKY_VIDEO_BASE}/${encodeURIComponent(authorDid)}/${embed.cid}/360p/video.m3u8`,
                    // Formato alternativo 3: CDN direto com diferentes padrões
                    `${BSKY_CDN_BASE}/${authorDid}/${embed.cid}/video.m3u8`,
                    `${BSKY_CDN_BASE}/${authorDid}/${embed.cid}/playlist.m3u8`
                ];
                
                // URL HLS genérica (para compatibilidade)
                const hlsUrl = hlsPlaylistUrl;

                // 2. Construct fallback getBlob URL
                const serviceUrl = agent.service.toString();
                const baseUrl = serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`;
                
                // Para evitar problemas de CORS, vamos usar URLs que não tenham restrições
                // O Bluesky CDN não tem problemas de CORS, então vamos priorizar ele
                const computedFallbackUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${embed.cid}`;

                // 3. Construct streaming URL with Range request support
                // This URL will support HTTP Range requests for progressive loading
                const computedStreamingUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${embed.cid}&streaming=true`;
                const fallbackUrl = null; // fallback MP4 removido
                const streamingUrl = null; // fallback MP4 removido
                
                // Debug logging
                console.log('🔍 url debug', { authorDid, cid: embed.cid });
                
                // Test HLS availability com mais rigor - testar todas as opções
                console.log('🔍 test HLS playlist');
                const isHlsPlaylistAvailable = await testHlsAvailability(hlsPlaylistUrl);
                
                // Se o HLS playlist estiver disponível, vamos verificar se é um master playlist válido
                if (isHlsPlaylistAvailable) {
                    console.log('🔍 playlist available');
                    try {
                        const playlistResponse = await fetch(hlsPlaylistUrl);
                        if (playlistResponse.ok) {
                            const playlistText = await playlistResponse.text();
                            const hasStreamInfo = playlistText.includes('#EXT-X-STREAM-INF');
                            const hasMasterPlaylist = playlistText.includes('.m3u8?session_id=');
                            
                            if (hasStreamInfo && hasMasterPlaylist) {
                                console.log('✅ master playlist');
                            } else {
                                console.log('⚠️ maybe not master');
                            }
                        }
                    } catch (e) {
                        console.log('⚠️ validate playlist failed', e);
                    }
                }
                
                // Test different HLS qualities
                console.log('🔍 test HLS direct');
                let bestHlsDirectUrl: string | null = null;
                for (const hlsDirectUrl of hlsDirectUrls) {
                    const isAvailable = await testHlsAvailability(hlsDirectUrl);
                    if (isAvailable) {
                        bestHlsDirectUrl = hlsDirectUrl;
                        console.log('✅ direct', hlsDirectUrl);
                        break;
                    }
                }
                
                // Test alternative HLS URLs if primary ones fail
                let bestAlternativeHlsUrl: string | null = null;
                if (!isHlsPlaylistAvailable && !bestHlsDirectUrl) {
                    console.log('🔍 test alt HLS');
                    for (const altUrl of alternativeHlsUrls) {
                        const isAvailable = await testHlsAvailability(altUrl);
                        if (isAvailable) {
                            bestAlternativeHlsUrl = altUrl;
                            console.log('✅ alt', altUrl);
                            break;
                        }
                    }
                }
                
                // Sempre testar URLs alternativas se a playlist principal não for completamente válida
                if (!bestAlternativeHlsUrl && isHlsPlaylistAvailable) {
                    console.log('🔍 test alt as backup');
                    for (const altUrl of alternativeHlsUrls) {
                        const isAvailable = await testHlsAvailability(altUrl);
                        if (isAvailable) {
                            bestAlternativeHlsUrl = altUrl;
                            console.log('✅ alt backup', altUrl);
                            break;
                        }
                    }
                }
                
                // Se ainda não temos uma URL alternativa, vamos tentar as URLs de qualidade específicas
                if (!bestAlternativeHlsUrl) {
                    console.log('🔍 test quality HLS');
                    const qualityUrls = [
                        `${BSKY_VIDEO_BASE}/${encodeURIComponent(authorDid)}/${embed.cid}/720p/video.m3u8`,
                        `${BSKY_VIDEO_BASE}/${encodeURIComponent(authorDid)}/${embed.cid}/480p/video.m3u8`,
                        `${BSKY_VIDEO_BASE}/${encodeURIComponent(authorDid)}/${embed.cid}/360p/video.m3u8`
                    ];
                    
                    for (const qualityUrl of qualityUrls) {
                        const isAvailable = await testHlsAvailability(qualityUrl);
                        if (isAvailable) {
                            bestAlternativeHlsUrl = qualityUrl;
                            console.log('✅ quality', qualityUrl);
                            break;
                        }
                    }
                }
                
                console.log('🔍 HLS results', { playlist: isHlsPlaylistAvailable, direct: !!bestHlsDirectUrl, alternative: !!bestAlternativeHlsUrl });
                
                // Determine preferred URL and content type
                let preferredUrl: string | null;
                let contentType: ContentType;
                
                // Priorizar HLS playlist, depois HLS direto, depois alternativas, depois MP4
                if (isHlsPlaylistAvailable) {
                    preferredUrl = hlsPlaylistUrl;
                    contentType = 'hls';
                    console.log('✅ use playlist', preferredUrl);
                    
                    // Teste adicional: verificar se o HLS realmente funciona
                    console.log('🔍 validate HLS content');
                    try {
                        const playlistResponse = await fetch(hlsPlaylistUrl);
                        if (playlistResponse.ok) {
                            const playlistText = await playlistResponse.text();
                            console.log('🔍 Full HLS playlist content:', playlistText);
                            
                            // Verificar se contém segmentos funcionais OU se é um master playlist
                            const hasValidSegments = playlistText.includes('.ts') || playlistText.includes('#EXTINF');
                            const hasStreamInfo = playlistText.includes('#EXT-X-STREAM-INF');
                            const hasMasterPlaylist = playlistText.includes('.m3u8?session_id=');
                            
                            if (hasValidSegments && hasStreamInfo) {
                                console.log('✅ segments + info');
                            } else if (hasStreamInfo && hasMasterPlaylist) {
                                console.log('✅ master with sub-playlists');
                                // Este é um master playlist válido, não precisa de fallback
                            } else if (hasValidSegments) {
                                console.log('⚠️ segments without info');
                                // Se não tem stream info, pode não funcionar no player
                                console.log('🔄 try alt HLS');
                                
                                // Tentar URLs alternativas se a playlist estiver incompleta
                                if (bestAlternativeHlsUrl) {
                                    preferredUrl = bestAlternativeHlsUrl;
                                    contentType = 'hls';
                                    console.log('🔄 alt URL', preferredUrl);
                                }
                            } else {
                                console.log('❌ invalid HLS playlist');
                                // Se não tem segmentos nem sub-playlists, tentar URLs alternativas
                                console.log('🔄 try alt (invalid)');
                                
                                if (bestAlternativeHlsUrl) {
                                    preferredUrl = bestAlternativeHlsUrl;
                                    contentType = 'hls';
                                    console.log('🔄 alt URL', preferredUrl);
                                }
                            }
                        }
                    } catch (e) {
                        console.log('⚠️ validate failed', e);
                    }
                } else if (bestHlsDirectUrl) {
                    preferredUrl = bestHlsDirectUrl;
                    contentType = 'hls';
                    console.log('✅ use direct', preferredUrl);
                } else if (bestAlternativeHlsUrl) {
                    preferredUrl = bestAlternativeHlsUrl;
                    contentType = 'hls';
                    console.log('✅ use alt', preferredUrl);
                } else {
                    // Sem fallback: manter sem preferredUrl
                    preferredUrl = null;
                    contentType = 'auto';
                    console.log('🧹 MP4 fallback removed. No preferred URL without HLS.');
                }
                
                // Log final do contentType escolhido
                console.log('🎯 chosen', { contentType, preferredUrl, hasValidHls: contentType === 'hls' });
                
                setPlaybackUrls({ 
                    hlsUrl, 
                    hlsPlaylistUrl,
                    hlsDirectUrl: bestHlsDirectUrl,
                    fallbackUrl, 
                    streamingUrl, 
                    preferredUrl,
                    contentType,
                    isLoading: false 
                });
            } catch (e) {
                console.error("❌ Failed to construct video URLs", e);
                setError("Could not determine video URL.");
                setPlaybackUrls(prev => ({ 
                    ...prev,
                    isLoading: false 
                }));
            }
        };

        // Only resolve URLs if agent is ready
        if (agent && agent.service) {
            resolveUrls();
        } else {
            setPlaybackUrls(prev => ({ 
                ...prev,
                isLoading: false 
            }));
        }
    }, [agent, embed, authorDid]);

    return { ...playbackUrls, error };
};
