import styled from 'styled-components';

interface ToggleProps {
  toggle: boolean;
  className?: string;
}

export const ToggleIcon = ({ toggle, className, ...props }: ToggleProps) => {
  return (
      <OnIconStyled className={className} toggle={toggle} viewBox="0 0 40 21" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <rect x='0.5' y="1" width="39" height="19" rx="9.5" fill="currentColor" stroke="currentColor" className='back'/>
        <rect x={toggle ? '1' : '20.5'} y="1" width="19" height="19" rx="9.5" fill="currentColor" stroke="currentColor" className='front'/>
      </OnIconStyled>
  )
}

const OnIconStyled = styled.svg<{ toggle: boolean }>`
    .back {
        fill: ${({ theme, toggle }) => (toggle ? theme.color.primary : theme.color.border)};
        stroke: ${({ theme, toggle }) => (toggle ? theme.color.primary : theme.color.border)};
        transition: fill 0.8s, stroke 0.5s;
    }
    
    .front {
        fill: #ffffff;
        stroke: ${({ theme, toggle }) => (toggle ? theme.color.primary : theme.color.border)};
        transition: x 0.5s, fill 0.5s, stroke 0.5s;
    }
`