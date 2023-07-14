import { useState, useEffect } from "react";
import { Editor } from "./components/Editor";
import { OpenDirectory } from "../wailsjs/go/main/App";
import { main } from "../wailsjs/go/models";
import { Col, Row, Divider, Typography, Button, Layout, Menu } from "antd";
import type { MenuProps } from "antd";
import { MenuInfo } from "rc-menu/lib/interface";
import {
  PlusOutlined,
  FolderOutlined,
  FileOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import "./App.css";
import { fileAtom, fileStatusAtom, FileStatus } from "./FileAtom";
import { useRecoilState } from "recoil";

const { Header, Content, Sider, Footer } = Layout;
type MenuItem = Required<MenuProps>["items"][number];
const { Text } = Typography;

// TODO: if not md then disabled: true
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

export function App() {
  const [filePath, setFilePath] = useRecoilState(fileAtom);
  const [fileStatus, setFileStatus] = useRecoilState(fileStatusAtom);
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

  function statusIcon(status: FileStatus) {
    switch (status) {
      case "Saved":
        return <CheckCircleOutlined />;
      case "Unsaved":
        return <WarningOutlined />;
      case "Saving":
        return <LoadingOutlined />;
    }
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider theme="light">
        <div className="sidebar">
          <div className="projects">
            <Row
              style={{
                "justifyContent": "space-between",
                "alignItems": "center",
                "marginTop": "5px",
              }}
            >
              <Text strong type="secondary">
                Projects
              </Text>
              <Button
                icon={<PlusOutlined />}
                type="text"
                onClick={onClickDir}
                size="small"
              />
            </Row>
          </div>
          <Divider style={{ "marginBottom": "0px", "marginTop": "0px" }} />
          <Menu
            onClick={onClickFile}
            selectedKeys={filePath == "" ? [] : [filePath]}
            theme="light"
            mode="inline"
            items={items}
          />
        </div>
      </Sider>
      <Layout style={{ marginLeft: "0px" }}>
        <Content>
          <Editor />
        </Content>
        <Footer
          style={{
            textAlign: "center",
            position: "sticky",
            bottom: 0,
            padding: "5px",
            width: "100%",
            height: "28px",
          }}
        >
          <Row
            style={{
              justifyContent: "end",
              alignItems: "center",
              marginRight: "10px",
              fontSize: "18px",
            }}
          >
            {statusIcon(fileStatus)}
          </Row>
        </Footer>
      </Layout>
    </Layout>
  );
}

export default App;
