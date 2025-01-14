import { wei } from '@synthetixio/wei';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import ErrorView from 'components/Error';
import StyledSlider from 'components/Slider/StyledSlider';
import { useFuturesContext } from 'contexts/FuturesContext';
import { editCrossMarginSize } from 'state/futures/actions';
import {
	selectAboveMaxLeverage,
	selectCrossMarginBalanceInfo,
	selectLeverageSide,
	selectMaxLeverage,
	selectPosition,
	selectTradeSizeInputs,
} from 'state/futures/selectors';
import { useAppDispatch, useAppSelector } from 'state/hooks';
import { FlexDivRow } from 'styles/common';

export default function OrderSizeSlider() {
	const { t } = useTranslation();
	const { maxUsdInputAmount } = useFuturesContext();
	const dispatch = useAppDispatch();
	const { freeMargin: freeCrossMargin } = useAppSelector(selectCrossMarginBalanceInfo);
	const { susdSizeString } = useAppSelector(selectTradeSizeInputs);
	const aboveMaxLeverage = useAppSelector(selectAboveMaxLeverage);
	const maxLeverage = useAppSelector(selectMaxLeverage);
	const leverageSide = useAppSelector(selectLeverageSide);
	const position = useAppSelector(selectPosition);

	const [percent, setPercent] = useState(0);
	const [usdValue, setUsdValue] = useState(susdSizeString);

	// eslint-disable-next-line
	const onChangeMarginPercent = useCallback(
		(value, commit = false) => {
			setPercent(value);
			const fraction = value / 100;
			const usdAmount = maxUsdInputAmount.mul(fraction).toString();
			const usdValue = Number(usdAmount).toFixed(0);
			setUsdValue(usdValue);
			if (commit) {
				dispatch(editCrossMarginSize(usdValue, 'usd'));
			}
		},
		[maxUsdInputAmount, dispatch]
	);

	useEffect(() => {
		if (susdSizeString !== usdValue) {
			if (!susdSizeString || maxUsdInputAmount.eq(0)) {
				setPercent(0);
				return;
			}

			const percent = wei(susdSizeString).div(maxUsdInputAmount).mul(100).toNumber();
			setPercent(Number(percent.toFixed(2)));
		}
		// eslint-disable-next-line
	}, [susdSizeString]);

	if (aboveMaxLeverage && position?.position?.side === leverageSide) {
		return (
			<ErrorView
				message={t('futures.market.trade.input.max-leverage-error', {
					maxLeverage: parseInt(maxLeverage.toString()),
				})}
			/>
		);
	}

	return (
		<SliderRow>
			<StyledSlider
				minValue={0}
				maxValue={100}
				step={1}
				disabled={freeCrossMargin.eq(0)}
				defaultValue={percent}
				value={percent}
				onChange={(_, value) => onChangeMarginPercent(value, false)}
				onChangeCommitted={(_, value) => onChangeMarginPercent(value, true)}
				marks={[
					{ value: 0, label: `0%` },
					{ value: 100, label: `100%` },
				]}
				valueLabelDisplay="auto"
				valueLabelFormat={(v) => `${v}%`}
				$currentMark={percent}
			/>
		</SliderRow>
	);
}

const SliderRow = styled(FlexDivRow)`
	margin-top: 8px;
	margin-bottom: 32px;
	position: relative;
`;
