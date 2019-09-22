import React from 'react'
import { css } from "@emotion/core"
import marked from 'marked';
import Button from './button'
import FileInput from './input'
import { ContextProviderComponent, BlogContext } from './context'
import { createPost } from '../graphql/mutations'
import { Storage, API, graphqlOperation } from 'aws-amplify'
import config from '../aws-exports'
import format from 'date-fns/format'
import uuid from 'uuid/v4'
import { highlight, fontFamily } from '../theme'
import SimpleMDE from "react-simplemde-editor"
import saveFile from '../utils/saveFile'

const {
  aws_user_files_s3_bucket_region: region,
  aws_user_files_s3_bucket: bucket
} = config

const postState = {
  content: '',
  title: '',
  description: ''
}

class NewPost extends React.Component {
  state = {
    isPublishing: false,
    post: postState,
    cover_image: '',
    file: {},
    isEditing: true
  }
  setPost = (key, value) => {
    this.setState({
      post: {
        ...this.state.post,
        [key]: value
      }
    })
  }
  toggleInput = () => {
    this.setState({ isEditing: !this.state.isEditing })
  }
  publish = async (isPublished) => {
    const { file, post, post: { title, content, description } } = this.state
    if (!title || !content) return
    this.setState({ isPublishing: true })
    if (file.name) {
      const fileForUpload = await saveFile(file)
      post['cover_image'] = fileForUpload
    }
    if (isPublished) {
      post['published'] = true
    } else {
      post['published'] = false
    }
    const postInput = {title, content}

    if (description) {
      postInput.description = description
    }

    try {
      await API.graphql(graphqlOperation(createPost, { input: post }))
      this.setState({ isPublishing: false, post: postState })
      this.props.toggleViewState('list')
    } catch (err) {
      this.setState({ isPublishing: false })
      console.log({ err })
    }
  }

  getMarkdownText(markdown) {
    var rawMarkup = marked(markdown, {sanitize: true});
    return { __html: rawMarkup };
  }
  uploadImage = (event) => {
    const { target: { files } } = event
    const fileForUpload = files[0]
    this.setState({
      cover_image: URL.createObjectURL(event.target.files[0]),
      file: fileForUpload
    })
  }
  render() {
    const { isEditing, cover_image } = this.state
    const dynamicTextArea = css`
      margin-top: 30px;
    `
    const saveButton = css`
      background-color: ${highlight};
    `
    const dynamicPreviewButton = css`
      color: ${highlight};
    `
    return (
      <div css={container}>
        {
          isEditing ? (
            <div>
              <button onClick={this.toggleInput} css={[fixedPreview, dynamicPreviewButton]}>
                Preview
              </button>
            </div>
          ) : (
            <button onClick={this.toggleInput} css={[fixedPreview, dynamicPreviewButton]}>
              Edit
            </button>
          )
        }
        {
          isEditing ? (
            <div css={textareaContainer}>
              {
                cover_image && <img css={coverImageEdit} src={cover_image} />
              }
              <input
                value={this.state.post.title}
                css={[titleStyle, titleInputStyle]}
                onChange={e => this.setPost('title', e.target.value)}
                placeholder="Post title"
              />
              <input
                value={this.state.post.description}
                css={[titleStyle, descriptionInputStyle]}
                onChange={e => this.setPost('description', e.target.value)}
                placeholder="Post description"
              />
              <SimpleMDE
                css={dynamicTextArea}
                placeholder="Your post in markdown."
                value={this.state.post.content}
                onChange={value => this.setPost('content', value)}
              />
              <div css={buttonContainer}>
                <Button
                  onClick={() => this.toggleInput()}
                  title="Preview"
                  customCss={preview}
                />
                <Button
                  onClick={() => this.publish(true)}
                  title="Publish"
                  customCss={publish}
                />
                <Button
                  onClick={() => this.publish()}
                  title="Save"
                  customCss={[publish, saveButton]}
                />
                <FileInput
                  placeholder="Add Cover Image"
                  customCss={[imageButton]}
                  onChange={this.uploadImage}
                />
              </div>
            </div>
          ) : (
            <div>
              {
                cover_image && <img css={coverImage} src={cover_image} />
              }
              <div css={postPreview} className="blog-post">
                <h1 css={previewTitleStyle}>{this.state.post.title}</h1>
                <p css={previewDescriptionStyle}>{this.state.post.description}</p>
                <p css={dateStyle}>{format(new Date(), 'MMMM dd yyyy')}</p>
                <section
                  css={blogPost}
                  dangerouslySetInnerHTML={this.getMarkdownText(this.state.post.content)}
                />  
              </div>
              <div css={buttonContainer}>
                <Button
                  onClick={() => this.toggleInput()}
                  title="Edit"
                  customCss={preview}
                />
                <Button
                  onClick={() => this.publish()}
                  title="Publish"
                  customCss={publish}
                />
              </div>
            </div>
          )
        }
      </div>
    )
  }
}

const dateStyle = css`
  margin-top: 0px;
  font-size: 15px !important;
  font-family: ${fontFamily} !important;
`

const previewTitleStyle = css`
`

const previewDescriptionStyle = css`
  font-weight: 500;
  font-size: 22px;
  color: rgba(0, 0, 0, .55);
`

const container = css`
  padding-top: 25px;
`

const fixedPreview = css`
  position: fixed;
  font-weight: 700;
  margin-left: -140px;
  color: blue;
  border: none;
  outline: none;
  font-family: ${fontFamily};
  font-weight: 400;
  background-color: transparent;
  cursor: pointer;
`

const coverImage = css`
  margin-top: 20px;
`

const coverImageEdit = css`
  margin-top: 20px;
  margin-bottom: 20px;
`

const postPreview = css`
  background-color: white;
  padding: 10px 0px 50px;
`

const titleStyle = css`
  font-size: 45px;
  border: none;
  outline: none;
  width: 100%;
  margin: 20px 0px 5px;
  font-weight: 300;
`

const descriptionStyle = css`
  font-size: 25px;
  border: none;
  outline: none;
  width: 100%;
  font-weight: 300;
`

const titleInputStyle = css`
  ${titleStyle};
  font-size: 30px;
  margin-top: 0px;
`

const descriptionInputStyle = css`
  ${titleStyle};
  font-size: 20px;
`

const textareaContainer = css`
  display: flex;
  flex-direction: column;
`

const baseButton = css`
  margin-top: 20px;
  margin-left: 10px;
  padding: 2px 14px;
  border: none;
`

const preview = css`
  ${baseButton};
  background-color: white;
  color: black;
`

const imageButton = css`
  ${baseButton};
  color: black;
  background-color: #dedede;
`

const publish = css`
  ${baseButton};
  background-color: #00a54a;
  color: white;
`

const blogPost = css`
`

const buttonContainer = css`
  display: flex;
`

const NewPostWithContext = props => (
  <ContextProviderComponent>
    <BlogContext.Consumer>
      {
        context => <NewPost {...props} context={context} />
      }
    </BlogContext.Consumer>
  </ContextProviderComponent>
)

export default NewPostWithContext