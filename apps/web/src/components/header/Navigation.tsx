import { styled } from 'styled-components';
import { NAVIGATION } from '../../constants/navigation';
import Link from 'next/link';

const Navigation = () => {
  return (
    <StyledNavigation id="navigation">
      <ul>
        {NAVIGATION.map((item, index) => (
          <li key={index}>
            <Link href={'/'}>  {item.title}</Link>
          </li>
        ))}
      </ul>
    </StyledNavigation>
  );
};

const StyledNavigation = styled.nav`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    white-space: nowrap;

    width: 100%;
    height: 100%;

    ul {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        padding: 0;
        margin: 0 1rem 0 1rem;
        gap: 1.4rem;
        line-height: 1;

        li {
            padding: 0;
            margin: 0;
            cursor: pointer;

            font-size: ${({theme}) => theme.fontSize.small};

            a {
                font-size: ${({theme}) => theme.fontSize.small};
                font-weight: ${({theme}) => theme.fontWeight.medium};
                color: ${({theme}) => theme.color.text};
                text-decoration: none;
                transition: color 0.3s ease;

                &:hover {
                    color: ${({theme}) => theme.color.primary};
                    font-weight: ${({theme}) => theme.fontWeight.medium};
                }
            }
        }
    }

    @media ${({theme}) => theme.mediaQuery.tablet} {
        display: none;
    }
`;

export default Navigation;
