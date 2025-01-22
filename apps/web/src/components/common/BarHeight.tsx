import styled from "styled-components";

interface BarHeightProps {
  height?: string;
  $margin?: string;
}

function BarHeight({height, $margin} : BarHeightProps) {
  return (
    <BarStyled height={height} $margin={$margin}/>
  );
}

const BarStyled = styled.div<BarHeightProps>`
    border-left: 1px solid ${({theme}) => theme.color.border};
    height: ${({height}) => height || '100%'};
    margin-left: ${({$margin}) => $margin || '4rem' };
    margin-right: ${({$margin}) => $margin || '4rem' };
    
`;

export default BarHeight;