// Cynhyrchwyd y ffeil hon yn awtomatig. PEIDIWCH Â MODIWL
// This file is automatically generated. DO NOT EDIT
import {main} from '../models';

export function DeleteFile(arg1:string):Promise<void>;

export function GetConfig():Promise<main.Config>;

export function NewFileDir(arg1:string,arg2:boolean):Promise<void>;

export function OpenDirectory():Promise<main.FileNode>;

export function ReadFile(arg1:string):Promise<string>;

export function RelativePath(arg1:string,arg2:string):Promise<string>;

export function RenameFile(arg1:string,arg2:string):Promise<string>;

export function SaveFile(arg1:string,arg2:string):Promise<void>;

export function SelectFile():Promise<main.File>;
