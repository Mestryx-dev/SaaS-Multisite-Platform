import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table, Thead, Tbody, Tr, Th, Td } from "./table";

const meta = {
  title: "Components/Table",
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <Table>
      <Thead>
        <Tr>
          <Th>Name</Th>
          <Th>Status</Th>
        </Tr>
      </Thead>
      <Tbody>
        <Tr>
          <Td>Luna Bijoux</Td>
          <Td>Live</Td>
        </Tr>
        <Tr>
          <Td>Demo Site</Td>
          <Td>Draft</Td>
        </Tr>
      </Tbody>
    </Table>
  ),
};
