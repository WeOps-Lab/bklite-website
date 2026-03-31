import ComponentTypes from '@theme-original/NavbarItem/ComponentTypes';
import IconNavbarLink from '@site/src/components/IconNavbarLink';
import JoinCommunityNavbarButton from '@site/src/components/JoinCommunityNavbarButton';
import LogoutNavbarButton from '@site/src/components/LogoutNavbarButton';

export default {
  ...ComponentTypes,
  'custom-icon-link': IconNavbarLink,
  'custom-join-community': JoinCommunityNavbarButton,
  'custom-logout': LogoutNavbarButton,
};
