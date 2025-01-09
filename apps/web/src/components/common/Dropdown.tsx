'use client';

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
  toggleButton?: React.ReactNode;
  isOpen?: boolean;
  className?: string;
}

const Dropdown = ({
                    children,
                    toggleButton,
                    isOpen = false,
                    className,
                  }: Props) => {
  const [ open, setOpen ] = useState(isOpen);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  return (
    <StyledDropdown $open={open} ref={dropdownRef} className={`${className}`}>
      <div onClick={() => setOpen(!open)}>
        {toggleButton &&
          React.isValidElement(toggleButton) &&
          (toggleButton.type !== React.Fragment
            ? React.cloneElement(
              toggleButton as React.ReactElement<
                React.HTMLAttributes<HTMLDivElement>
              >,
              {
                className: open ? 'open' : '',
              },
            )
            : toggleButton)}
      </div>

      <div className="panel" onClick={() => setOpen(false)}>
        {children}
      </div>
    </StyledDropdown>
  );
};

interface StyleProps {
  $open: boolean;
}

const StyledDropdown = styled.div<StyleProps>`
    position: relative;
    cursor: pointer;

    button {
        cursor: pointer;

        svg {
            font-size: ${({theme}) => theme.fontSize.large};
        }
    }

    &.auth {
        .panel {
            position: absolute;
            top: 2.5rem;
            right: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;

            width: auto;
            height: auto;
            max-height: ${({$open}) => ($open ? '300px' : '0')};
            padding: ${({$open}) => ($open ? '1rem' : '0')};
            gap: 0.5rem;
            font-size: ${({theme}) => theme.fontSize.small};

            background: ${({theme}) => theme.color.surface};
            box-shadow: ${({theme}) => theme.shadow.medium};
            border: 1px solid ${({theme}) => theme.color.border};
            border-radius: ${({theme}) => theme.borderRadius.soft};
            z-index: 1000;
            white-space: nowrap;

            transform-origin: top right;
            opacity: ${({$open}) => ($open ? '1' : '0')};
            transition: max-height 0.5s ease, opacity 0.3s ease, padding 0.3s ease;
            overflow: hidden;

            .item {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 100%;
                padding: 0.3rem 1rem;
                cursor: pointer;

                color: ${({theme}) => theme.color.text};
                font-size: ${({theme}) => theme.fontSize.small};

                a {
                    padding: 0;
                    margin: 0;
                }

                button {
                    background: rebeccapurple;
                }

                &:hover {
                    color: ${({theme}) => theme.color.primary};
                }
            }
        }
    }

    &.drawer {
        display: none;

        .panel {
            transform-origin: top;
            transform: ${({$open}) => ($open ? 'scaleY(1)' : 'scaleY(0)')};
            opacity: ${({$open}) => ($open ? '1' : '0')};
            transition: transform 0.3s ease, opacity 0.3s ease;
            overflow: hidden;

            width: 100vw;
            position: absolute;
            top: 2.5rem;
            left: 0;
            margin-left: -1rem;
            background: ${({theme}) => theme.color.surface};
            border: 1px solid ${({theme}) => theme.color.border};
            box-shadow: ${({theme}) => theme.shadow.medium};

            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 1rem;
            gap: 0.5rem;

            .item {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 100%;
                padding: 0.3rem 0;
                cursor: pointer;

                color: ${({theme}) => theme.color.text};
                font-size: ${({theme}) => theme.fontSize.small};

                a {
                    padding: 0;
                    margin: 0;
                }

                &:hover {
                    color: ${({theme}) => theme.color.primary};
                }
            }
        }

        @media ${({theme}) => theme.mediaQuery.tablet} {
            display: block;
        }
    }
`;

export default Dropdown;
