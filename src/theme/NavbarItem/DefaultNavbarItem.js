import React from 'react';
import DefaultNavbarItem from '@theme-original/NavbarItem/DefaultNavbarItem';
import MegaMenu from '@site/src/components/MegaMenu';

export default function DefaultNavbarItemWrapper(props) {
    // 如果是产品文档链接，替换为 MegaMenu
    if (props.to === '/docs/opspilot/introduce') {
        return <MegaMenu />;
    }

    return <DefaultNavbarItem {...props} />;
}
