// 创建装机任务
import React, { Component } from 'react';
import { Radio, Button, Select, Input } from 'antd';
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import api from 'src/tools/api';
import Context from './Context';
import { actions } from 'src/redux/modules/installManager';


import './installTaskCreate.scss';

// const Step = Steps.Step;

class ClusterConfigurationPopUp extends Component {

    constructor(props) {
        super(props);
        this.state = {
            value: 1,
        };
    }
    componentDidMount() {
    }

    componentWillReceiveProps(nextProps, nextContext) {
    }

    onChange = e => {
        console.log('radio checked', e.target.value);
        this.setState({
            value: e.target.value,
        });
    };
    //改变选择内容时候请求的接口
    getTaskModel=()=>{
        api.updateFunctionCombination().then(res => {
            console.log(1)
            if (res.data.success !== 'true') {
                this.setState({ tableLoading: false });
                // message.error(res.data.msg);
                return;
            }
        })
    }

    //焦点移入时候获取模版信息接口
    taskOnFocus=()=>{
        api.getFunctionNodeByHostIdAndCombinationId().then(res => {
            console.log(2)
            if (res.data.success !== 'true') {
                this.setState({ tableLoading: false });
                // message.error(res.data.msg);
                return;
            }
        })
    }

    stepController = (type) => {
        if (type === 'last') {
        } else {
            
        }
    };

    render() {
        return (
            <Context.Provider value={{ task: this.state.task, changeState: this.changeState }} >
                <div className="select-sd-title">
                    <span className="task-select-title">1.选择模版</span>
                    <Select
                        showSearch
                        style={{ width: 200, marginLeft: 20 }}
                        placeholder="集群配置"
                        optionFilterProp="children"
                        onChange={this.getTaskModel}
                        onFocus={this.taskOnFocus}
                        // onBlur={onBlur}
                        // onSearch={onSearch}
                        filterOption={(input, option) =>
                            option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                    >
                    </Select>
                </div>
                <div className="select-sd-title select-second-content">
                    <span className="task-select-title">2.默认设置</span>
                    <div className="select-content">关闭selinux:是</div>
                    <div className="select-content">停止/禁用firewall：是</div>
                    <div className="select-content">最大限度使用物理内存：是</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0 0 20px 0' }}>
                    <Button
                        htmlType="button"
                        type="primary"
                        className="sd-grey"
                        style={{ width: '72px', marginRight: '10px' }}
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

export default connect(null, mapDispatchToProps)(ClusterConfigurationPopUp)
