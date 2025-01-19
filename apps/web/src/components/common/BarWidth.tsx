import styled from "styled-components";

interface BarWidthProps {
  width?: string;
  margin?: string;
  className?: string;
}

function BarWidth({width, margin, className} : BarWidthProps) {
  return (
    <BarStyled width={width} margin={margin} className={className}/>
  );
}

const BarStyled = styled.div<BarWidthProps>`
    border-bottom: 1px solid ${({theme}) => theme.color.border};
    width: ${({width}) => width || '100%'};
    margin-top: ${({margin}) => margin || '5rem'};
    margin-bottom: ${({margin}) => margin || '5rem'};
`;

export default BarWidth;