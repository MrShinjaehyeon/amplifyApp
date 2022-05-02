import logo from './logo.svg';
import './App.css';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import {API, Storage} from 'aws-amplify'
import {listTodos} from './graphql/queries'
import {createTodo as createNoteMutation, deleteTodo as deleteNoteMutation} from './graphql/mutations'
import { useEffect, useState } from 'react';

const initFormState = {name: '', description: ''}

function App() {
  const [todos, setTodos] = useState([])
  const [formData, setFormData] = useState(initFormState)

  useEffect(() => {
    fetchTodos()
  }, [])

  
  async function fetchTodos() {
    const apiData = await API.graphql({query: listTodos})
    const todosFormAPI = apiData.data.listTodos.items
    await Promise.all(todosFormAPI.map(async todo => {
      if(todo.image) {
        const image = await Storage.get(todo.image)
        todo.image = image
      }
      return todo
    }))
    setTodos(apiData.data.listTodos.items)
  }

  async function createTodo() {
    if (!formData.name || !formData.description) return;
    await API.graphql({query: createNoteMutation, variables: {input: formData}})
    if (formData.image) {
      const image = await Storage.get(formData.image)
      formData.image = image
    }
    setTodos([...todos, formData])
    setFormData(initFormState)
  } 

  async function deleteTodo({id}) {
    const newTodosArray = todos.filter(todo => todo.id !== id)
    setTodos(newTodosArray)
    await API.graphql({query: deleteNoteMutation, variables: {input : {id}}})
  }

  async function onChange(e) {
    console.log(e)
    if (!e.target.files[0]) return
    const file = e.target.files[0]
    setFormData({...formData, image: file.name})
    await Storage.put(file.name, file)
    fetchTodos()
  }
  

  return (
    <div className="App">
      <h1>My Notes App</h1>
      <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Todo name"
        value={formData.name}
      />
      <input
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="Todo description"
        value={formData.description}
      />
      <input
        type='file'
        onChange={onChange}
      />
      <button onClick={createTodo}>Create Todo</button>
      <div style={{marginBottom: 30}}>
        {
          todos.map(todo => (
            <div key={todo.id || todo.name}>
              <h2>{todo.name}</h2>
              <p>{todo.description}</p>
              <button onClick={() => deleteTodo(todo)}>Delete note</button>
              {
                todo.image && <img src={todo.image} style={{width: 400}} />
              }
            </div>
          ))
        }
      </div>
      <Authenticator>
      {({ signOut, user }) => (
        <div className="App">
          <p>
            Hey {user.username}, welcome to my channel, with auth!
          </p>
          <button onClick={signOut}>Sign out</button>
        </div>
      )}
    </Authenticator>
    </div>
  );
}

export default App;
