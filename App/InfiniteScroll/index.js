import React from 'react';
import { Text, View, ListView } from 'react-native';

import css from './css';
import Item from '../List/Item';
import Footer from './Footer';


const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });


export default class InfiniteScroll extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			rowItems: [],
			items: ds.cloneWithRows([]),
			page: 0,
			loading: false,
			error: false,
			more: false,
		};

		this.address = props.address || '';
		this.pageSize = props.pageSize || 5;

		this.onInfiniteScroll = (typeof props.useScrollEvent === 'undefined') ? true : props.useScrollEvent;
		this.power = false;
	}

	componentDidMount() {
		const { startPage } = this.props;
		this.get(startPage || 1);
	}

	get(page=1) {
		const { address, header, pageParam, correctionDatas, delay } = this.props;
		const { rowItems } = this.state;

		this.power = false;
		this.setState({ loading: true });

		setTimeout(() => fetch(`${address}&${pageParam}=${page}`, {
			method: 'GET',
			headers: {
				...header,
			},
		})
			.then((response) => response.json())
			.then((responseJSON) => {
				let datas = [];
				if (correctionDatas)
				{
					datas = correctionDatas(responseJSON);
				}
				else
				{
					datas = responseJSON;
				}

				if (datas.length)
				{
					this.setState({
						rowItems: rowItems.concat(datas),
						items: ds.cloneWithRows(rowItems.concat(datas)),
						loading: false,
						page: page,
						more: true,
					});
					this.power = true;
				}
				else
				{
					this.setState({ loading: false, more: false });
					this.power = false;
				}
			}, (error) => {
				this.setState({ loading: false, error: true });
				this.power = false;
			}), delay || 30);
	}

	loadMore() {
		this.get(this.state.page + 1);
	}

	_renderRow(data) {
		const { onPressItem } = this.props;
		return ( <Item data={data} onPress={onPressItem}/> );
	}

	_renderFooter() {
		const { loading, error, more } = this.state;
		const { useMoreButton } = this.props;

		return (
			<Footer
				onPressMore={this.loadMore.bind(this)}
				loading={loading}
				error={error}
				more={more && useMoreButton}/>
		);
	}

	render() {
		const { style, pageSize } = this.props;
		const { items } = this.state;

		return (
			<ListView
				onEndReached={() => {
					if (!this.power || !this.onInfiniteScroll) return false;
					this.loadMore();
				}}
				dataSource={items}
				pageSize={pageSize}
				initialListSize={pageSize}
				enableEmptySections={true}
				renderRow={this._renderRow.bind(this)}
				renderFooter={this._renderFooter.bind(this)}
				style={[css.viewport, style]}/>
		);
	}
}