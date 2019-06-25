import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Select, Tabs, message } from 'antd';
import { ContainerBody } from "src/components/LittleComponents";
import api from "src/tools/api";

import HDFS from './HDFSFile';
import FragmentFile from './FragmentFile';

const TabPane = Tabs.TabPane;
const { Option } = Select;

// styled-components样式包装组件

const StyledTabs = styled(Tabs)`
    /* 覆写antd样式 */
    .ant-tabs-bar.ant-tabs-top-bar {
        background: #ffffff;
        border-radius: 4px;
        border-bottom: 2px solid #D3E4FF;
        margin: 3px 1px 0;
        box-shadow: 0 0 4px 1px rgba(80, 84, 90, 0.1);

        .ant-tabs-tab {
            padding: 9px 15px 13px;
            margin-left: 20px;
            font-size: 15px;
            font-family: SourceHanSansCN-Regular, "Microsoft YaHei", sans-serif;
            font-weight: 400;
            color: rgba(65, 97, 136, 1);
        }
    }
`;

// 下拉菜单
const StyledSelect = styled(Select)`
    display: inline-block;
    width: 160px;
    vertical-align: middle;
`;

// 集群下啦菜单
const StyledClusterSelect = styled(StyledSelect)`
    margin-right: 15px;
`;

// 小文件梳理组件
export default function FileArrangement(props) {
    // 集群选择值
    const [clusterValue, setClusterValue] = useState('');
    // 集群获取失败状态
    // const [clusterRequestError, setClusterRequestError] = useState(false);

    //集群选项
    const [clusterOptions, setClusterOptions] = useState([]);
    useEffect(() => {
        getClusterOptions();
    }, []);// 近首次加载时触发

    // 上方tab列表
    const topPanes = [
        {
            key: 'tab1',
            title: 'HDFS文件处理',
            content: <HDFS clusterValue={clusterValue} />,
        }
    ];

    // 下方tab列表
    const bottomPanes = [
        {
            key: 'tab1',
            title: '小文件处理',
            content: <FragmentFile clusterValue={clusterValue} />,
        }
    ];

    // 获取集群列表
    const getClusterOptions = async () => {
        try {
            const res = await api.getClusterBasicInfo();

            if (res.data.success !== 'true') {
                message.destroy();
                message.error(res.data.msg);
                // setClusterRequestError(true);
                return;
            }

            setClusterOptions(res.data.data);
            setClusterValue(res.data.data[0].clusterName);
            // setClusterRequestError(false);
        } catch (err) {
            message.destroy();
            message.error('获取集群列表失败');
        }
    };

    // 集群选项修改事件
    const onClusterChange = (value) => {
        setClusterValue(value);
    };

    return (
        <ContainerBody>
            <StyledTabs
                defaultActiveKey="tab1"
                tabBarExtraContent={
                    <StyledClusterSelect
                        notFoundContent="暂无数据"
                        value={clusterValue}
                        onChange={onClusterChange}
                    >
                        {
                            clusterOptions.map(item =>
                                <Option key={item.clusterName} value={item.clusterName}>
                                    {item.clusterName}
                                </Option>
                            )
                        }
                    </StyledClusterSelect>
                }
            >
                {
                    topPanes.map(pane =>
                        <TabPane key={pane.key} tab={pane.title}>{pane.content}</TabPane>
                    )
                }
            </StyledTabs>
            <StyledTabs
                defaultActiveKey="tab1"
            >
                {
                    bottomPanes.map(pane =>
                        <TabPane key={pane.key} tab={pane.title}>{pane.content}</TabPane>
                    )
                }
            </StyledTabs>
        </ContainerBody>
    );
}