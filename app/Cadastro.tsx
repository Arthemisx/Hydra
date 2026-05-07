import React from 'react';
import './App.css';
import { TextInput } from 'react-native';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src="/Hydra_v2/src/images/logo-sao-camilo.jpg" className='logo' alt="logo"/>
        <div className='form-login'>
            <h1>Hydra</h1>
            <div className='login-input'>
                <p>E-mail:</p>
                <input type="text" />
            </div>
            <div className='login-input'>
                <p>Senha:</p>
                <input type="password" />
            </div>
            <button>Entrar</button>
        </div>
        <p className='cad-div'>Não tem cadastro? <a href=''>Cadastre-se</a></p>
      </header>
    </div>
  );
}

export default App;
