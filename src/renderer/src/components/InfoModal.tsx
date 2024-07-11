import { Modal, ActionIcon, Accordion, Text, Anchor, Table, Paper, TableData } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconUserQuestion } from '@tabler/icons-react'
import { actions } from '@src/contexts/Spotlight'

export default function InfoModal(): JSX.Element | null {
  const [helpModalOpen, { open, close }] = useDisclosure(false)
  const tableData: TableData = {
    head: ['Name', 'Note', 'Shortcut'],
    body: actions.map(action => {
      if (!action.rightSection) return undefined
      return [action.label, action.description, action.rightSection]
    }).filter(action => action != undefined)
  };
  return (
    <>
      <ActionIcon
        size="lg"
        variant="default"
        onClick={open}
        style={{
          width: 40,
          height: 40,
          position: 'absolute',
          bottom: 10,
          right: 10,
          pointerEvents: 'all'
        }}
        mod={['transparent']}
      >
        <IconUserQuestion size={18} />
      </ActionIcon>
      <Modal title={`Version: ${__APP_VERSION__}`} opened={helpModalOpen} onClose={close} size='xl'>
        <Paper shadow="xs" p="0" withBorder>
        <Table data={tableData} captionSide='top' verticalSpacing='sm'/>
        </Paper>
        <br />
        <Accordion variant="contained" defaultValue="customization">
          <Accordion.Item value="Contributors" key="4">
            <Accordion.Control>Contributors</Accordion.Control>
            <Accordion.Panel>
              GRX is a free and open source software for viewing EDA Manufacturing Artwork files ( like Gerber and GDSII ). Built by{' '}
              <Anchor href="https://github.com/hpcreery" target="_blank">
                Hunter Creery
              </Anchor>{' '}
              and{' '}
              <Anchor href="https://github.com/phcreery" target="_blank">
                Peyton Creery
              </Anchor>
              .
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="Software Toolchain" key="1">
            <Accordion.Control>Software Toolchain</Accordion.Control>
            <Accordion.Panel>
              GRX is built with{' '}
              <Anchor href="https://electronjs.org/" target="_blank">
                Electron
              </Anchor>
              ,{' '}
              <Anchor href="https://reactjs.org/" target="_blank">
                React
              </Anchor>
              ,{' '}
              <Anchor href="https://mantine.dev/" target="_blank">
                Maintine
              </Anchor>
              , and{' '}
              <Anchor href="http://regl.party/" target="_blank">
                REGL
              </Anchor>
              .
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="License" key="2">
            <Accordion.Control>License</Accordion.Control>
            <Accordion.Panel>
              <Text>
                GRX is licensed under the{' '}
                <Anchor href="https://opensource.org/license/mit/">MIT License</Anchor> and found{' '}
                <Anchor href="https://github.com/hpcreery/GRX/blob/master/LICENSE">here</Anchor>.
              </Text>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="Disclaimer" key="3">
            <Accordion.Control>Disclaimer</Accordion.Control>
            <Accordion.Panel>
              <Text>
                This software is provided &quot;as is&quot; and without any express or implied
                warranties, including, without limitation, the implied warranties of merchantability
                and fitness for a particular purpose. The entire risk arising out of the use or
                performance of the software remains with you. In no event shall the authors or
                copyright holders be liable for any damages whatsoever (including, without
                limitation, damages for loss of business profits, business interruption, loss of
                business information, or other pecuniary loss) arising out of the use of or
                inability to use this software. Because some states/jurisdictions do not allow the
                exclusion or limitation of liability for consequential or incidental damages, the
                above limitation may not apply to you.
              </Text>
              <br />
              <Text c="red">
                All data is processed locally on your computer. No data is sent to any servers. Your
                Data and Intellectual Property is not shared with anyone or any company.
              </Text>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Modal>
    </>
  )
}
