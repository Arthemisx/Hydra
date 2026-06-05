import React from 'react';
import './App.css';
import { TextInput } from 'react-native';

function Cadastro() {
  return (
    <div className="App">
      <header className="App-header">
        <img src="/Hydra_v2/src/images/logo-sao-camilo.jpg" className='logo' alt="logo"/>
        <div className='form-cad'>
            <h1>Hydra</h1>
            <div className='cad-input-div'>
                <p>Nome:</p>
                <input type="text" />
            </div>
            <div className='cad-input-div'>
                <p>E-mail:</p>
                <input type="text" />
            </div>
            <div className='cad-input-div'>
                <p>Senha:</p>
                <input type="password" />
            </div>
            <div className='cad-input-div'>
                <p>Confirmar senha:</p>
                <input type="text" />
            </div>
            <div className='cad-input-user'>
                <p>Tipo de usuário:</p>
                <p>Atleta</p>
                <input type="radio" id="atleta" name="tipo-user" value="atleta"/>
                <p>Nutricionista</p>
                <input type="radio" id="nutricionista" name="tipo-user" value="nutricionista"/>
                <p>Treinador</p>
                <input type="radio" id="treinador" name="tipo-user" value="treinador"/>
            </div>
            <button>Cadastrar</button>
        </div>
        <p className='cad-div'>Não tem cadastro? <a href=''>Cadastre-se</a></p>
      </header>
    </div>
  );
}

export default Cadastro;
