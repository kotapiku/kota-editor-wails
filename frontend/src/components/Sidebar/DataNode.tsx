import { FileOutlined } from "@ant-design/icons";
import type { DataNode } from "antd/es/tree";
import { main } from "../../../wailsjs/go/models";

// TODO: if not md then disabled: true
export function fromFileToDataNode(node: main.FileNode): DataNode {
  return {
    key: node.current_file.absolute_path,
    icon: node.is_dir ? null : <FileOutlined />,
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
  console.log(node, keyToUpdate, update);
  if (node.key === keyToUpdate) {
    return update == undefined ? node : update(node);
  } else if (node.children) {
    let idx = node.children.findIndex((child) => child.key == keyToUpdate);
    if (idx != -1) {
      if (update == undefined) {
        return {
          ...node,
          children: node.children
            .slice(0, idx)
            .concat(node.children.slice(idx + 1)),
        };
      } else {
        return {
          ...node,
          children: node.children
            .slice(0, idx)
            .concat([update(node.children[idx])])
            .concat(node.children.slice(idx + 1)),
        };
      }
    } else {
      return {
        ...node,
        children: node.children.map((child) =>
          updateNodeRecursive(child, keyToUpdate, update)
        ),
      };
    }
  }
  return node;
}

export function newFileRecursive(
  node: DataNode,
  keyToDir: string,
  fileName: string,
  isDir: boolean
): DataNode {
  console.log(node, keyToDir, fileName, isDir);
  if (node.key == keyToDir && node.children) {
    let newFile = new main.FileNode({
      current_file: {
        basename: fileName,
        absolute_path: keyToDir + "/" + fileName,
      },
      is_dir: isDir,
      children: isDir ? [] : undefined,
    });
    return {
      ...node,
      children: [...node.children, fromFileToDataNode(newFile)],
    };
  }
  if (node.children) {
    return {
      ...node,
      children: node.children.map((child) =>
        newFileRecursive(child, keyToDir, fileName, isDir)
      ),
    };
  }
  return node;
}

export function fileOptions(
  dn: DataNode | undefined
): { label: string; value: string }[] {
  if (dn == undefined) {
    return [];
  }
  let ret = [];
  if (dn.children == undefined) {
    ret.push({ label: dn.title, value: dn.key as string });
  }
  return ret.concat(dn.children?.flatMap(fileOptions) ?? []);
}
