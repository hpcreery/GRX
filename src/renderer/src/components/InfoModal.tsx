import React from 'react'
import { QuestionOutlined } from '@ant-design/icons'
import { Button, Card, Space, theme, Modal, Typography, Collapse } from 'antd'
import chroma from 'chroma-js'
import { ConfigEditorProvider } from '../contexts/ConfigEditor'
const { useToken } = theme
const { Text, Title, Paragraph, Link } = Typography
const { Panel } = Collapse

export default function InfoModal(): JSX.Element | null {
  const { token } = useToken()
  const { transparency, blur } = React.useContext(ConfigEditorProvider)
  const [helpModalOpen, setHelpModalOpen] = React.useState<boolean>(false)

  const showModal = (): void => {
    setHelpModalOpen(true)
  }

  const handleHelpModalOk = (): void => {
    setHelpModalOpen(false)
  }

  const handleHelpModalCancel = (): void => {
    setHelpModalOpen(false)
  }

  return (
    <Card
      style={{
        width: 'unset',
        height: 'unset',
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: transparency
          ? chroma(token.colorBgElevated).alpha(0.7).css()
          : chroma(token.colorBgElevated).css(),
        backdropFilter: transparency ? `blur(${blur}px)` : '',
        pointerEvents: 'all'
      }}
      bodyStyle={{ padding: 3 }}
    >
      <Space size={1}>
        <Button icon={<QuestionOutlined />} type="text" onClick={showModal} />
      </Space>
      <Modal
        title="Information"
        open={helpModalOpen}
        onOk={handleHelpModalOk}
        onCancel={handleHelpModalCancel}
      >
        <Title level={2}>Version: {__APP_VERSION__}</Title>
        <Collapse defaultActiveKey={[]}>
          <Panel header="Contributors" key="4">
            <Paragraph>
              <Text strong>GRX</Text> is a free and open source software for viewing Gerber files.
              Built by{' '}
              <Link href="https://github.com/hpcreery" target="_blank">
                Hunter Creery
              </Link>{' '}
              and{' '}
              <Link href="https://github.com/phcreery" target="_blank">
                Peyton Creery
              </Link>
              .
            </Paragraph>
          </Panel>
          <Panel header="Software Toolchain" key="1">
            <Paragraph>
              <Text strong>GRX</Text> is built with{' '}
              <Link href="https://electronjs.org/" target="_blank">
                Electron
              </Link>
              ,{' '}
              <Link href="https://reactjs.org/" target="_blank">
                React
              </Link>
              ,{' '}
              <Link href="https://ant.design/" target="_blank">
                Ant Design
              </Link>
              , and{' '}
              <Link href="https://pixijs.com/" target="_blank">
                PixiJS
              </Link>
              .
            </Paragraph>
          </Panel>
          <Panel header="License" key="2">
            <Paragraph>
              <Text strong>GRX</Text> is licensed under the{' '}
              <Link href="https://opensource.org/license/mit/" target="_blank">
                MIT License
              </Link>{' '}
              and found <Link href="https://github.com/hpcreery/GRX/blob/master/LICENSE">here</Link>
              .
            </Paragraph>
          </Panel>
          <Panel header="Disclaimer" key="3">
            <Paragraph>
              <Text strong>DISCLAIMER</Text>
              <br />
              <Text>
                This software is provided "as is" and without any express or implied warranties,
                including, without limitation, the implied warranties of merchantability and fitness
                for a particular purpose. The entire risk arising out of the use or performance of
                the software remains with you. In no event shall the authors or copyright holders be
                liable for any damages whatsoever (including, without limitation, damages for loss
                of business profits, business interruption, loss of business information, or other
                pecuniary loss) arising out of the use of or inability to use this software. Because
                some states/jurisdictions do not allow the exclusion or limitation of liability for
                consequential or incidental damages, the above limitation may not apply to you.
              </Text>
            </Paragraph>
            <Paragraph type="danger">
              All data is processed locally on your computer. No data is sent to any servers. Your
              Data and Intellectual Property is not shared with anyone or any company.
            </Paragraph>
          </Panel>
        </Collapse>
      </Modal>
    </Card>
  )
}
