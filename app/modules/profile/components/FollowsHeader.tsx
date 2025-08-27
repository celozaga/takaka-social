import React from 'react';
import { BackHeader } from '@/components/shared';

interface FollowsHeaderProps {
    title: string;
}

const FollowsHeader: React.FC<FollowsHeaderProps> = ({ title }) => {
    return (
        <BackHeader title={title} />
    );
};

export default FollowsHeader;
