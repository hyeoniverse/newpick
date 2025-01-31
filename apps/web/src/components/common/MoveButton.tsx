import styled from "styled-components";
import Button from "@/components/common/Button";

interface Props {
  onClick?: () => void;
  text?: string;
  frontIcon?: React.ReactNode;
  backIcon?: React.ReactNode;
  className?: string;
  width?: string;
  disabled?: boolean;
}

function MoveButton({onClick, frontIcon, backIcon, text, className, width, disabled}: Props) {
  
  return (
    <MoveButtonStyled
      scheme="monoOutline"
      onClick={onClick}
      className={className}
      width={width}
      disabled={disabled}
    >
      
      {frontIcon}
      {text}
      {backIcon}
    
    </MoveButtonStyled>
  );
}

const MoveButtonStyled = styled(Button)<Props>`
    border-radius: ${({theme}) => theme.borderRadius.capsule};
    color: ${({theme}) => theme.color.mediumGrey};
    width: ${({width}) => width || "fit-content"};
    height: fit-content;

    svg {
        color: ${({theme}) => theme.color.mediumGrey};
    }
`;

export default MoveButton;