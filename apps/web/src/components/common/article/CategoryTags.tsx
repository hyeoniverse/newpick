import { CATEGORIES } from '@/constants/categories';
import { useSelectInterests, useSingleSelectInterest } from '@/hooks/useInterests';
import { cx } from '@/styles/tw';
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
		<div className={cx('np-category-tags', className)}>
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
		</div>
	);
}
