import React from 'react';
import './App.css';
import { TextInput } from 'react-native';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src="src\images\hydra-logo.jpeg" className="App-logo" alt="logo" />
        <div className='form-login'>
            <h1>Hydra</h1>
            <text>E-mail:</text>
            <TextInput></TextInput>
            <text>Senha:</text>
            <TextInput></TextInput>
            <button>Entrar</button>
        </div>
        <text>Não tem cadastro? <a href=''>Cadastre-se</a></text>
      </header>
    </div>
  );
}

export default App;
