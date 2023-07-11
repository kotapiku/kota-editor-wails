import React, { useEffect, useState } from "react";
import { Editor } from "./components/Editor";
import { OpenDirectory } from "../wailsjs/go/main/App";
import { main } from "../wailsjs/go/models";
import { Row, Divider, Typography, Button, Layout, Menu } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { MenuInfo } from "rc-menu/lib/interface";
import { FolderOutlined, FileOutlined } from "@ant-design/icons";
import "./App.css";

const { Header, Content, Sider } = Layout;
type MenuItem = Required<MenuProps>["items"][number];
const { Text } = Typography;

// if not md then disabled: true
function fromFileToMenuItem(node: main.FileNode): MenuItem {
  return {
    key: node.current_dir.absolute_path,
    icon: node.is_dir ? <FolderOutlined /> : <FileOutlined />,
    label: node.current_dir.basename,
    children: node.is_dir
      ? node.children.map((child) => fromFileToMenuItem(child))
      : undefined,
  };
}

function App() {
  const [filePath, setFilePath] = useState<string>();
  const [items, setItems] = useState<MenuItem[]>([]);

  const onClickDir = async () => {
    let dir = await OpenDirectory();
    console.log("selected file: ", dir.current_dir);
    setItems([...items, fromFileToMenuItem(dir)]);
  };

  const onClickFile: MenuProps["onClick"] = (e: MenuInfo) => {
    console.log("selected file: ", e.key);
    setFilePath(e.key);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider theme="light">
        <div className="sidebar">
          <div className="projects">
            <Row
              style={{
                "justify-content": "space-between",
                "align-items": "center",
              }}
            >
              <Text strong type="secondary">
                Projects
              </Text>
              <Button
                icon={<PlusOutlined />}
                type="text"
                onClick={onClickDir}
              />
            </Row>
          </div>
          <Divider style={{ "margin-bottom": "0px", "margin-top": "0px" }} />
          <Menu
            onClick={onClickFile}
            theme="light"
            mode="inline"
            items={items}
          />
        </div>
      </Sider>
      <Layout>
        <Content>
          <Editor filepath={filePath} />
        </Content>
        {/* <Footer style={{ textAlign: "center" }}>
          Ant Design ©2018 Created by Ant UED
        </Footer> */}
      </Layout>
    </Layout>
  );
}

export default App;
