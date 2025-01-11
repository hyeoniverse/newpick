import styled from "styled-components";

export const IconStyled = styled.div`
    background-color: ${({theme}) => theme.color.colorBackground};
    border-radius: ${({theme}) => theme.borderRadius.circle};
    width: 2.75rem;
    height: 2.75rem;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;

    svg {
        width: 1.5rem;
        height: 1.5rem;
        color: ${({theme}) => theme.color.primary};

        &:hover {
            color: ${({theme}) => theme.color.secondary};
            transition: all .3s ease;
        }
    }
`;