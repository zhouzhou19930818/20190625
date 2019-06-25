import { Layout } from 'antd';
import styled from 'styled-components';

let skin = {};

skin.blue = {
    sideBgColor: '#1265B8',
    sideFontColor: '#fff'
};

skin.green = {
    sideBgColor: '#13B5BF',
    sideFontColor: 'rgba(255,255,255,0.7)'
}

let getSkinConfig = (type = 'blue') => {
    const config = skin[type];

    return styled(Layout)`
        .ant-layout-sider {
            background: ${config.sideBgColor};
        }
        
        
        .ant-table-header tr th {
            background: ${config.sideBgColor}
        }
    `
};

export default getSkinConfig;