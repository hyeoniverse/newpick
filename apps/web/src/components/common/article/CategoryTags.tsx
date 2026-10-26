import { CATEGORIES } from '@/constants/categories';
import { useSelectInterests, useSingleSelectInterest } from '@/hooks/useInterests';
import { styled } from 'styled-components';
import Button from '@/components/common/Button';

type select = 'multiple' | 'single' | 'localSingle';
interface Props {
	className?: string;
	selectType?: select;
	selected?: string;
	onSelect?: (category: string) => void;
}

export default function CategoryTags({ className, selectType = 'multiple', selected, onSelect }: Props) {
	const { selectedInterest, handleSelectInterest } = useSingleSelectInterest();
	const { selectedInterests, handleSelectInterests } = useSelectInterests();

	return (
		<StyledCategoris className={className}>
			<ul className="categories">
				{CATEGORIES.slice(selectType === 'single' || 'localSingle' ? 1 : 0).map((category, index) => (
					<li key={index}>
						<Button
							type="button"
							scheme="default"
							onClick={
								selectType === 'localSingle'
									? () => onSelect && onSelect(category.name)
									: selectType === 'single'
										? () => handleSelectInterest(category)
										: () => handleSelectInterests(category)
							}
							className={
								selectType === 'localSingle'
									? selected === category.name
										? 'category-btn active'
										: 'category-btn'
									: selectedInterest === category.name || selectedInterests.includes(category.name)
										? 'category-btn active'
										: 'category-btn'
							}
						>
							{category.name}
						</Button>
					</li>
				))}
			</ul>
		</StyledCategoris>
	);
}

const StyledCategoris = styled.div`
	width: 100%;
	height: fit-content;
	display: flex;
	flex-direction: row;
	gap: 0.875rem;

	.bar {
		border-left: 1px solid ${({ theme }) => theme.color.lightGrey};
		height: auto;
	}

	.categories {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.category-btn {
		width: 4rem;
		color: ${({ theme }) => theme.color.primary};
		border-radius: ${({ theme }) => theme.radius.chip};
		border: 1px solid ${({ theme }) => theme.color.primary};
		transition:
			background-color 0.15s ease,
			color 0.15s ease;

		&:hover,
		&:focus-visible {
			background: color-mix(in srgb, ${({ theme }) => theme.color.primary} 10%, transparent);
		}
	}

	/* 고른 분야: 기본 버튼의 hover(글자를 강조색으로)가 강조색 바탕과 겹쳐 글자가 사라지지 않게 글자색을 고정하고, 바탕만 조금 진하게 */
	.category-btn.active {
		&,
		&:hover,
		&:focus-visible {
			color: ${({ theme }) => theme.color.background};
			background: ${({ theme }) => theme.color.primary};
		}

		&:hover,
		&:focus-visible {
			background: color-mix(in srgb, ${({ theme }) => theme.color.primary} 82%, ${({ theme }) => theme.color.text});
		}
	}

	.btn {
		display: flex;
		justify-content: center;
		align-items: center;
	}
`;
