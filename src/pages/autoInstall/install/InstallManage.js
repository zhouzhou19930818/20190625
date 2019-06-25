import React, { Component } from 'react';
import { Tabs, Steps, message } from 'antd';
import update from 'immutability-helper';

import { ContainerBody } from "src/components/LittleComponents";
import TaskList from './TaskList';
import TaskSetIp from './TaskSetIp';
import TaskSecuritySystem from './TaskSecuritySystem';
import PlatformAccess from './PlatformAccess';
import DiskReBalance from './DiskReBalance';
import TaskBigDataInitialization from './TaskBigDataInitialization';
import TaskClusterConfiguration from './TaskClusterConfiguration';
import TaskFinish from './TaskFinish';

import { reduxMapper } from 'src/redux/modules/installManager';
import { computedStyle, getNumber } from "src/tools/utils";
import api from "src/tools/api";

import './installTaskCreate.scss';


const TabPane = Tabs.TabPane,
    { Step } = Steps;

class InstallManage extends Component {
    state = {
        // 装机任务id
        automaticBaseTaskId: '',

        // 主机信息列表
        hostDataSource: [],

        // 主机信息加载状态
        hostDataLoading: false
    };

    panes = [
        {
            key: 'tab1',
            title: '未完成任务',
            content: () => <TaskList changeTaskId={this.changeTaskId} />,
        },
    ];

    wsConnectTimes = 0;

    steps = [
        {
            key: 'tab1',
            title: "安全系统",
            // content: () => <TaskSecuritySystem automaticBaseTaskId={this.state.automaticBaseTaskId} />,
            content: TaskSecuritySystem
        },
        {
            key: 'tab2',
            title: "设置IP",
            content: TaskSetIp,
        },
        {
            key: 'tab3',
            title: "平台接入",
            content: PlatformAccess,
        },
        {
            key: 'tab4',
            title: "安全加固",
            content: DiskReBalance,
        },
        {
            key: 'tab5',
            title: "大数据初始化",
            // content: () => <TaskBigDataInitialization automaticBaseTaskId={this.state.automaticBaseTaskId} />,
            content: TaskBigDataInitialization
        },
        {
            key: 'tab6',
            title: "集群配置",
            content: TaskClusterConfiguration,
        }, {
            key: 'tab7',
            title: "滚动重启",
            content: undefined,
        }, {
            key: 'tab8',
            title: "验证确认",
            content: TaskFinish,
        },
    ];

    componentDidMount() {
        this.mouseEvent();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.isExpendContent && nextProps.isExpendContent !== this.props.isExpendContent) {
            const dragContent = document.getElementById('task-dragContent');
            if (!dragContent) return;
            dragContent.style.top = '0px';
            dragContent.style.transition = 'top 0.5s';
            this.wsTimeout = setTimeout(() => {
                dragContent.style.transition = null;
            }, 1000);
        }
    }

    componentWillUnmount() {
        const header = document.getElementById('task-dragHeader');
        // 鼠标按下方块
        header.removeEventListener("touchstart", this.start);
        header.removeEventListener("mousedown", this.start);
        // 拖动
        window.removeEventListener("touchmove", this.moving);
        window.removeEventListener("mousemove", this.moving);
        // 鼠标松开
        window.removeEventListener("touchend", this.end);
        window.removeEventListener("mouseup", this.end);
        // 清理定时器
        this.wsTimeout && clearTimeout(this.wsTimeout);
    }

    //监听鼠标拖动事件
    mouseEvent = () => {
        const parent = document.getElementById('task-dragContent');
        const header = document.getElementById('task-dragHeader');
        const container = document.getElementsByClassName('task-drag-container')[0];

        //判断鼠标是否按下
        let isDown = false;
        //实时监听鼠标位置
        let currentY = 0;
        //记录鼠标按下瞬间的位置
        let originY = 0;
        //鼠标按下时移动的偏移量
        let offsetY = 0;

        this.moving = (e) => {
            e = e ? e : window.event;
            e.cancelBubble = true;
            e.stopPropagation();

            if (isDown) {
                currentY = e.clientY;
                offsetY = currentY - originY;   //计算鼠标移动偏移量
                const elY = getNumber(computedStyle(parent).top);
                const resY = elY + offsetY;
                // 判断鼠标是否超出可视区域范围
                if (resY > container.offsetHeight - 30) {
                    parent.style.top = container.offsetHeight - 30 + 'px';
                } else if (resY < 0) {
                    parent.style.top = '0px';
                } else {
                    parent.style.top = resY + 'px';
                }
                originY = currentY;
            }
        };
        this.start = (e) => {
            e.cancelBubble = true;
            e.stopPropagation();
            isDown = true;
            originY = e.clientY;
        };
        this.end = (e) => {
            e.cancelBubble = true;
            e.stopPropagation();
            if (isDown) {
                isDown = false;
                offsetY = 0;
                this.props.changeIsExpendContent(false);
            }
        };

        // 鼠标按下方块
        header.addEventListener("touchstart", this.start);
        header.addEventListener("mousedown", this.start);
        // 拖动
        window.addEventListener("touchmove", this.moving);
        window.addEventListener("mousemove", this.moving);
        // 鼠标松开
        window.addEventListener("touchend", this.end);
        window.addEventListener("mouseup", this.end);
    };

    //获取任务id
    changeTaskId = async (automaticBaseTaskId) => {
        await this.props.changeIsExpendContent(true);
        await this.props.changeStepCurrent(automaticBaseTaskId - 1);
        await this.props.changeTaskLatestStep(automaticBaseTaskId - 1);
        await this.setState({ hostDataLoading: true })
        const res = await api.getHostByBaseTaskId(automaticBaseTaskId);
        const data = await res.data;
        if (data.success !== 'true') {
            data.msg && message.error(data.msg);
        }
        this.setState({
            hostDataSource: (data.data || []).map((item, index) => {
                return { ...item, key: index }
            }),
            automaticBaseTaskId: automaticBaseTaskId,
            hostDataLoading: false
        })
    }

    //步骤点击事件
    onChange = current => {
        this.props.changeStepCurrent(current);
    };

    connectWebsocket = (callback) => {
        if (!this.websocket) {
            if (this.wsConnectTimes > 10) return;
            this.wsConnectTimes = this.wsConnectTimes + 1;
            this.websocket = new WebSocket(api.wsUrl, `WS-DATAE-TOKEN.${localStorage.getItem('token')}`);
        }
        this.websocket.onopen = () => {
            callback();
            setInterval(() => this.websocket.send('HeartBeat'), 5000);
        };
        this.websocket.onmessage = (evt) => {
            try {
                const res = JSON.parse(evt.data);
                if (res.wsMsgType) {
                    const newMsg = update(this.props.websocketMsg, { $set: res.data });
                    this.props.setWebsocketMsg(newMsg);
                }
            } catch (e) {
            }

        };
        this.websocket.onclose = (evt) => {
            clearInterval(this.wsTimeout);
            this.websocket = null;
            this.connectWebsocket(() => {
                this.websocket.send(JSON.stringify({ taskId: this.props.taskId }));
            });
        };
        this.websocket.onerror = (evt) => {
            clearInterval(this.wsTimeout);
            this.websocket = null;
            this.connectWebsocket(() => {
                this.websocket.send(JSON.stringify({ taskId: this.props.taskId }));
            });
        };
        if (this.websocket.readyState === 1) {
            callback();
        }
    };

    render() {
        const current = this.props.stepCurrent;
        const customDot = (dot, { status, index }) => (
            <span className={'dot-img-' + index}></span>
        );
        const C = this.steps[current] ? this.steps[current].content : null;
        return (
            <ContainerBody className="task">
                <div className="drag-container task-drag-container">
                    <Tabs
                        activeKey="tab1"
                        className="sd-tabs"
                        onEdit={this.onEdit}
                    >
                        {
                            this.panes.map((pane) =>
                                <TabPane key={pane.key} tab={pane.title}>
                                    {pane.content()}
                                </TabPane>)
                        }
                    </Tabs>
                    <div className="drag-content task-drag-content" id="task-dragContent">
                        <div className="drag-header task-drag-header" id="task-dragHeader">
                        </div>
                        <div className="task-drag-steps-container">
                            <Steps
                                current={current}
                                progressDot={customDot}
                                onChange={this.onChange}
                            >
                                {this.steps.map((item, index) => <Step
                                    title={item.title}
                                    key={"step" + index}
                                />
                                )}
                            </Steps>
                            <div className="steps-content">
                                {C && <C {...this.state} />}
                            </div>
                        </div>
                    </div>
                </div>
            </ContainerBody>
        )
    }
}


export default reduxMapper(InstallManage);