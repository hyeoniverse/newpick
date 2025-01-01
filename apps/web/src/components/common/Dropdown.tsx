import React from "react";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

interface Props {
  children: React.ReactNode;
  toggleButton?: React.ReactNode;
  isOpen?: boolean;
  className?: string;
}

function Dropdown({
  children,
  toggleButton,
  isOpen = false,
  className = "",
}: Props) {
  const [open, setOpen] = useState(isOpen);
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

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [dropdownRef]);

  return (
    <StyledDropdown $open={open} ref={dropdownRef} className={`${className}`}>
      <div onClick={() => setOpen(!open)}>
        {toggleButton &&
          React.cloneElement(toggleButton as React.ReactElement, {
            className: open ? "open" : "",
          })}
      </div>
      <div className="panel" onClick={() => setOpen(false)}>
        {children}
      </div>
    </StyledDropdown>
  );
}

interface StyleProps {
  $open: boolean;
}

const StyledDropdown = styled.div<StyleProps>`
  position: relative;
  cursor: pointer;

  button {
    background: none;
    border: none;
    cursor: pointer;
    outline: none;

    svg {
      font-size: ${({ theme }) => theme.fontSize.large};
    }
  }

  &.auth {
    .panel {
      position: absolute;
      top: 3.2rem;
      right: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;

      width: auto;
      height: auto;
      max-height: ${({ $open }) =>
        $open ? "300px" : "0"}; /* max-height 애니메이션 */
      padding: ${({ $open }) => ($open ? "1rem" : "0")};
      gap: 0.5rem;
      font-size: ${({ theme }) => theme.fontSize.medium};

      background: ${({ theme }) => theme.color.surface};
      box-shadow: ${({ theme }) => theme.shadow.default};
      border-radius: ${({ theme }) => theme.borderRadius.default};
      z-index: 1000;
      white-space: nowrap;

      transform-origin: top right; /* 애니메이션이 우측 상단에서 시작 */
      opacity: ${({ $open }) => ($open ? "1" : "0")};
      transition:
        max-height 0.5s ease,
        /* max-height를 부드럽게 조정 */ opacity 0.3s ease,
        padding 0.3s ease; /* padding도 애니메이션에 포함 */
      overflow: hidden; /* 콘텐츠가 잘리지 않도록 hidden 설정 */

      .item {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0.5rem 1.2rem;

        color: ${({ theme }) => theme.color.text};
        border-radius: ${({ theme }) => theme.borderRadius.default};
        border-bottom: 1px solid ${({ theme }) => theme.color.border};
        cursor: pointer;

        &:hover {
          color: ${({ theme }) => theme.color.primary};
        }
      }
    }
  }

  &.drawer {
    .panel {
      transform-origin: top;
      transform: ${({ $open }) => ($open ? "scaleY(1)" : "scaleY(0)")};
      opacity: ${({ $open }) => ($open ? "1" : "0")};
      transition:
        transform 0.3s ease,
        opacity 0.3s ease;
      overflow: hidden;

      width: 100vw;
      position: absolute;
      top: 2.11rem;
      left: 0;
      margin-left: -1rem;
      background: ${({ theme }) => theme.color.surface};
      border-bottom: 1px solid ${({ theme }) => theme.color.border};
      box-shadow: ${({ theme }) => theme.shadow.medium};

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

        color: ${({ theme }) => theme.color.text};
        font-size: ${({ theme }) => theme.fontSize.small};

        a {
          padding: 0;
          margin: 0;
        }

        &:hover {
          color: ${({ theme }) => theme.color.primary};
        }
      }
    }

    @media (min-width: 768px) {
      display: none;
    }
  }
`;

export default Dropdown;
