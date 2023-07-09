import React, { useEffect, useState } from "react";
import "./App.css";
import { Editor } from "./components/Editor";
import { Breadcrumb, Button, Layout, Menu } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { SelectFile } from "../wailsjs/go/main/App";
import { main } from "../wailsjs/go/models";

const { Header, Content, Sider } = Layout;

function App() {
  const [file, setFile] = useState<main.File>();
  const onClick = async () => {
    let file = await SelectFile();
    console.log("selected file: ", file.absolute_path);
    setFile(file);
  };

  function filenameItems(): { title: string }[] {
    return [{ title: file == undefined ? "" : file.absolute_path }];
  }

  useEffect(() => {
    filenameItems();
  }, [file]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider>
        <Button icon={<UploadOutlined />} onClick={onClick}>
          Open file
        </Button>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={["4"]} />
      </Sider>
      <Layout>
        <Breadcrumb items={filenameItems()} />
        <Content style={{ margin: "0 16px" }}>
          <Editor filepath={file?.absolute_path} />
        </Content>
        {/* <Footer style={{ textAlign: "center" }}>
          Ant Design ©2018 Created by Ant UED
        </Footer> */}
      </Layout>
    </Layout>
  );
}

export default App;
