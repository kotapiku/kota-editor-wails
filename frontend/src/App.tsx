import React, { useState } from "react";
import "./App.css";
import { Editor } from "./components/Editor";
import { Input, Button, Layout, Menu, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { SelectFile } from "../wailsjs/go/main/App";

const { Header, Content, Sider } = Layout;

function App() {
  const [filepath, setFilepath] = useState<string>();
  const onClick = async () => {
    let filepath: string = await SelectFile();
    console.log("selected file: ", filepath);
    setFilepath(filepath);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider>
        <Button icon={<UploadOutlined />} onClick={onClick}>
          Open file
        </Button>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={["4"]} />
      </Sider>
      <Layout>
        <Content style={{ margin: "0 16px" }}>
          <Editor filepath={filepath} />
        </Content>
        {/* <Footer style={{ textAlign: "center" }}>
          Ant Design ©2018 Created by Ant UED
        </Footer> */}
      </Layout>
    </Layout>
  );
}

export default App;
