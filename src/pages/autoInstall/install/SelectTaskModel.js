// 创建装机任务
import React, { Component } from 'react';
import { Button, Select, Input, message, Row, Col } from 'antd';
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import api from 'src/tools/api';
import Context from './Context';
import { actions } from 'src/redux/modules/installManager';

import './installTaskCreate.scss';

const Option = Select.Option;

class SelectTaskModel extends Component {

    constructor(props) {
        super(props);
        this.state = {
            // 模板列表
            templateList: [],

            // 默认配置的信息
            defaultConfigInfo: [],

            // 自定义配置信息
            customConfigInfo: [],
        };
    }
    componentDidMount() {
        this.getTemplateList();
    }

    // 获取模板的文件列表
    getTemplateList = () => {
        api.getFunctionCombinationByType(this.props.taskId).then(res => {
            if (res.data.success === 'true') {
                this.setState({
                    templateList: res.data.data || []
                });
            }
        })
    }

    /** 选择了一个模板，根据模板id和主机id请求模板的配置
     *  @param {number} id: 模板id
     */
    handleSelectTemplate = (id) => {
        api.getFunctionNodeByHostIdAndCombinationId(`hostId=${12}&combinationId=${id}`)
            .then(res => {
                if (res.data.success !== 'true') {
                    message.error('该模板没有配置信息，请重新选择其他模板');
                    return;
                }
                const defaultConfigInfo = [], customConfigInfo = [];
                (res.data.data || []).map(item => {
                    defaultConfigInfo.push({
                        title: item.discription,
                        value: item.functionNodeCode
                    });
                    item.paramsJson = '{"username":"sdnmuser"}';
                    const customConfig = JSON.parse(item.paramsJson);
                    Object.entries(customConfig).map(data => {
                        customConfigInfo.push({
                            title: data[0],
                            value: data[1]
                        });
                        return data;
                    })
                    return item;
                });
                this.setState({
                    defaultConfigInfo,
                    customConfigInfo
                });
            })
    }

    render() {
        const { templateList, customConfigInfo, defaultConfigInfo } = this.state;
        return (
            <Context.Provider>
                <div className="sd-title">
                    <span>选择模板</span>
                </div>
                <div className="select-task-modal-content">
                    <p className="task-select-title">1.选择模板</p>
                    <div className="task-select-content">
                        <Row>
                            <Col span={6}>大数据模板：</Col>
                            <Col span={14}>
                                <Select
                                    showSearch
                                    style={{ width: '100%' }}
                                    placeholder="请选择模版"
                                    optionFilterProp="children"
                                    filterOption={(input, option) =>
                                        option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                    }
                                    onChange={val => this.handleSelectTemplate(val)}
                                >
                                    {
                                        templateList.map(item => <Option
                                            key={item.automaticFunctionCombinationId}
                                            value={item.automaticFunctionCombinationId}
                                        >
                                            {item.functionCombinationName}
                                        </Option>
                                        )
                                    }
                                </Select>
                            </Col>
                        </Row>
                    </div>
                </div>
                <div className="select-task-modal-content">
                    <p className="task-select-title">2.默认设置</p>
                    <div className="task-select-content">
                        {
                            defaultConfigInfo.map((item, index) => (
                                <Row key={index}>
                                    <Col span={6}>{item.title}：</Col>
                                    <Col span={14}>{item.value}</Col>
                                </Row>
                            ))
                        }
                    </div>
                </div>
                <div className="select-task-modal-content">
                    <p className="task-select-title">3.自定义设置</p>
                    <div className="task-select-content">
                        {
                            customConfigInfo.map((item, index) => (
                                <Row key={index}>
                                    <Col span={6}>{item.title}：</Col>
                                    <Col span={14}>
                                        <Input defaultValue={item.value} />
                                    </Col>
                                </Row>
                            ))
                        }
                    </div>
                </div>
                <div style={{ textAlign: 'center', paddingBottom: 20 }}>
                    <Button
                        htmlType="button"
                        type="primary"
                        className="sd-grey"
                        style={{ width: '72px', marginRight: '10px', marginLeft: 0 }}
                        onClick={() => this.stepController('last')}
                    >取消</Button>
                    <Button
                        htmlType="button"
                        type="primary"
                        className="sd-minor"
                        style={{ width: '72px' }}
                        onClick={() => this.stepController('next')}
                    >确定</Button>
                </div>
            </Context.Provider >
        )
    }
}

// 创建成功后跳到'tab3'
const mapDispatchToProps = (dispatch) => ({
    ...bindActionCreators(actions, dispatch)
});

export default connect(null, mapDispatchToProps)(SelectTaskModel)
