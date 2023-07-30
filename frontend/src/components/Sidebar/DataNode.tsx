import { FileOutlined } from "@ant-design/icons";
import type { DataNode } from "antd/es/tree";
import { main } from "../../../wailsjs/go/models";

// TODO: if not md then disabled: true
export function fromFileToDataNode(node: main.FileNode): DataNode {
  return {
    key: node.current_file.absolute_path,
    icon: node.is_dir ? <></> : <FileOutlined />,
    children: node.is_dir // undefined if node is file
      ? node.children.map((child) => fromFileToDataNode(child))
      : undefined,
    title: node.current_file.basename,
  };
}
// delete: update=undefined, update: update=関数。
export function updateNodeRecursive(
  node: DataNode,
  keyToUpdate: string,
  update: ((param: DataNode) => DataNode) | undefined
): DataNode {
  if (node.key === keyToUpdate) {
    return update == undefined ? node : update(node);
  } else if (node.children) {
    if (update == undefined) {
      node.children = node.children.filter((child) => {
        return child.key != keyToUpdate;
      });
    }
    node.children = node.children.map((child) =>
      updateNodeRecursive(child, keyToUpdate, update)
    );
  }
  return node;
}

export function newFileRecursive(
  node: DataNode,
  keyToDir: string,
  fileName: string,
  isDir: boolean
): DataNode {
  if (node.key == keyToDir && node.children) {
    let newFile = new main.FileNode({
      current_file: {
        basename: fileName,
        // absolute_path = fileName == "" ? keyToDir/ : keyToDir/fileName
        absolute_path: keyToDir + "/" + fileName,
      },
      is_dir: isDir,
      children: isDir ? [] : undefined,
    });
    node.children.push(fromFileToDataNode(newFile));
    return node;
  }
  if (node.children) {
    node.children = node.children.map((child) =>
      newFileRecursive(child, keyToDir, fileName, isDir)
    );
  }
  return node;
}
