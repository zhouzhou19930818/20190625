import React, { Fragment } from 'react';
import SDTable from 'src/components/SDTable';
import { message, Divider, Input } from "antd";
import { reduxMapper } from "src/redux/modules/diskTrouble";
import Context from "./Context";
import api from 'src/tools/api';
// import { debounce } from "src/tools/utils";
// import { getStatus } from "src/pages/diskTrouble/List/commonStatus";

// 0未装机，1已装机，2正在装机，3装机异常
const allStatus = ['未装机', '已装机', '正在装机', '装机异常', '人工修复（已装机）'];

class TaskSecuritySystem extends React.Component {
    columns = [
        {
            title: '序列号',
            dataIndex: 'cobblerHostSn ',
            key: 'cobblerHostSn ',
            width: 60,
            render: (text) => <span style={{ cursor: 'pointer' }}>{text}</span>
        },
        {
            title: 'mac地址',
            dataIndex: 'mac',
            key: 'mac',
            width: 80,
        },
        {
            title: '机房',
            dataIndex: 'roomName',
            key: 'roomName',
            width: 100,
        },
        {
            title: '操作系统',
            dataIndex: 'sysVersion ',
            key: 'sysVersion ',
            width: 80,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 80,
            render: (status) => <span style={{
                color: status === 5 ? '#008364' : '#213555',
                background: status === 5 ? '#EAF8E5' : '#D2F1FF',
                display: 'inline-block',
                padding: '4px 8px',
                fontSize: 12,
                fontWeight: 500,
                borderRadius: '2px'
            }}>{allStatus[status]}</span>,
        },
        {
            title: '操作',
            dataIndex: 'op',
            width: 60,
            render: (d, record) => <Fragment>
                <button
                    key="btn_1"
                    className="sd-anchor-button"
                    style={{ color: '#0E6EDF' }}
                    onClick={() => this.reinstall(record)}
                >
                    重装
                    </button>
                <Divider type="vertical" />
                <button
                    key="btn_2"
                    className="sd-anchor-button"
                    style={{ color: '#0E6EDF' }}
                    onClick={() => this.delete(record)}
                >
                    剔除
                    </button>
            </Fragment>
        },

    ];

    static contextType = Context;

    //重装
    reinstall = (record) => {
        if (!this.state.detailVisible) this.setState({ detailVisible: true });
        if (record) this.currentObj = record;
        api.reCreateInstallTask(record).then(res => {
            if (res.data.success !== 'true') {
                message.error(res.data.msg);
                return;
            }
        });
    };

    // 剔除
    delete = (record) => {
        api.removeHost(record.automaticHostId).then(res => {
            if (res.data.success !== 'true') {
                message.error(res.data.msg);
                return;
            }
            this.getList(this.props.automaticBaseTaskId);
        });
    };

    render() {
        const { hostDataSource, hostDataLoading } = this.props;
        return (
            <Fragment>
                <div className="sd-filter-form">
                    <Input.Search
                        allowClear
                        placeholder="请输入关键字"
                        style={{ width: 252 }}
                    // onChange={e => this.handleSearch(e.target.value)}
                    />
                </div>
                <SDTable
                    rowKey="automaticHostId"
                    loading={hostDataLoading}
                    columns={this.columns}
                    dataSource={hostDataSource}
                    scroll={{ y: 200 }}
                />
            </Fragment>
        )
    }
}
export default reduxMapper(TaskSecuritySystem);