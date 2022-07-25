import { PlusOutlined } from '@ant-design/icons'
import { Image, Upload } from 'antd'
import type { UploadProps } from 'antd/es/upload'
import type { UploadFile } from 'antd/es/upload/interface'
import { RcFile } from 'antd/lib/upload'
import React, { useState } from 'react'

const UploadImages: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [previewImage, setPreviewImage] = useState('')
  const [visible, setVisible] = useState(false)

  const getBase64 = (file: RcFile): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) =>
    setFileList(newFileList)

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile)
    }
    setPreviewImage(file.url || (file.preview as string))
    setVisible(true)
  }

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Click or drag file to upload</div>
    </div>
  )

  return (
    <>
      <Upload
        maxCount={4}
        multiple
        accept=".jpg, .jpeg, .png, .gif"
        listType="picture-card"
        fileList={fileList}
        onChange={handleChange}
        onPreview={handlePreview}
      >
        {fileList.length >= 4 ? null : uploadButton}
      </Upload>
      <Image
        alt="Preview"
        width={200}
        style={{ display: 'none' }}
        src={previewImage}
        preview={{
          visible,
          src: previewImage,
          onVisibleChange: (value) => {
            setVisible(value)
          },
        }}
      />
    </>
  )
}

export default UploadImages
