'use client';

import Link from 'next/link';
import styled from 'styled-components';
import { PCLogo, MoLogo } from '@/components/common/logos/LogoSVG';

interface Props {
  logoType?: 'footer-logo'; // 허용 가능한 값 명시
}

const Logo = ({logoType}: Props) => {
  return (
    <Link href="/">
      <StyledLogo>
        <PCLogo className={logoType === 'footer-logo' ? 'footer-logo desktop-logo' : 'desktop-logo'} />
        {logoType === 'footer-logo' ?
          <PCLogo className={logoType === 'footer-logo' ? 'footer-mobile-logo' : 'mobile-logo'} />
          :
          <MoLogo className="mobile-logo" />
        }
      </StyledLogo>
    </Link>
  );
};

const StyledLogo = styled.div`
    color: ${({theme}) => theme.color.primary};
    font-size: ${({theme}) => theme.fontSize.large};
    font-weight: ${({theme}) => theme.fontWeight.bold};
    cursor: pointer;
    display: flex;
    justify-content: center;

    .mobile-logo {
        display: none;
    }

    .desktop-logo {
        height: 22px;
    }

    .footer-logo {
        color: ${({theme}) => theme.color.subtext};
        height: 32px;
    }

    .footer-mobile-logo {
        display: none;
    }

    @media ${({theme}) => theme.mediaQuery.tablet} {
        .desktop-logo {
            display: none;
        }

        .mobile-logo {
            display: block;
            height: 36px;
            width: 36px;
        }

        .footer-mobile-logo {
            display: block;
            color: ${({theme}) => theme.color.subtext};
            height: 32px;
        }
    }

`;

export default Logo;
