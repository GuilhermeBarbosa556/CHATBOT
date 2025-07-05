import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FiSend } from '@react-icons/all-files/fi/FiSend';
import { FiImage } from '@react-icons/all-files/fi/FiImage';
import { FiMessageSquare } from '@react-icons/all-files/fi/FiMessageSquare';
import { FiTrash2 } from '@react-icons/all-files/fi/FiTrash2';

const Chatbot = () => {
  const [entrada, setEntrada] = useState('');
  const [mensagens, setMensagens] = useState([]);
  const [imagem, setImagem] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const fimMensagensRef = useRef(null);

  useEffect(() => {
    fimMensagensRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const enviarMensagem = async (e) => {
    e.preventDefault();
    if ((!entrada.trim() && !imagem)) return;

    setCarregando(true);
    const mensagemUsuario = { texto: entrada, remetente: 'usuario', imagem };
    setMensagens(prev => [...prev, mensagemUsuario]);
    
    try {
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAVP2Y1MdM34qJa24I1ueSkDukifTZ_dZ0';
      
      let dadosRequisicao = {};
      
      if (imagem) {
        const imagemBase64 = await arquivoParaBase64(imagem);
        
        dadosRequisicao = {
          contents: [{
            parts: [
              { text: entrada || "Descreva esta imagem" },
              {
                inlineData: {
                  mimeType: imagem.type,
                  data: imagemBase64
                }
              }
            ]
          }]
        };
      } else {
        dadosRequisicao = {
          contents: [{
            parts: [
              { text: entrada }
            ]
          }]
        };
      }
      
      const resposta = await axios.post(url, dadosRequisicao);
      
      const textoResposta = resposta.data.candidates?.[0]?.content?.parts?.[0]?.text || 
                         "Não foi possível obter uma resposta.";
      
      const mensagemBot = { texto: textoResposta, remetente: 'bot' };
      setMensagens(prev => [...prev, mensagemBot]);
    } finally {
      setCarregando(false);
      setEntrada('');
      setImagem(null);
    }
  };

  const arquivoParaBase64 = async (arquivo) => {
    return new Promise((resolve) => {
      const leitor = new FileReader();
      leitor.onloadend = () => {
        const stringBase64 = leitor.result.split(',')[1];
        resolve(stringBase64);
      };
      leitor.readAsDataURL(arquivo);
    });
  };

  const alterarImagem = (e) => {
    const arquivo = e.target.files[0];
    if (arquivo) {
      if (arquivo.size > 5 * 1024 * 1024) {
        alert('A imagem é muito grande. Por favor, selecione uma imagem menor que 5MB.');
        return;
      }
      setImagem(arquivo);
    }
  };

  const limparConversa = () => {
    if (window.confirm('Tem certeza que deseja limpar a conversa?')) {
      setMensagens([]);
    }
  };

  const removerImagem = () => {
    setImagem(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold">Chatbot com Gemini</h1>
        <div className="flex items-center space-x-4">
          {mensagens.length > 0 && (
            <button 
              onClick={limparConversa}
              className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded flex items-center"
              title="Limpar conversa"
            >
              <FiTrash2 size={16} />
            </button>
          )}
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mensagens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FiMessageSquare size={48} className="mb-4" />
            <p>Envie uma mensagem para começar a conversa</p>
          </div>
        ) : (
          mensagens.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.remetente === 'usuario' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 ${
                  msg.remetente === 'usuario'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 shadow'
                }`}
              >
                {msg.imagem && (
                  <div className="mb-2 relative">
                    <img
                      src={URL.createObjectURL(msg.imagem)}
                      alt="Enviada pelo usuário"
                      className="max-w-full h-auto rounded"
                    />
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.texto}</p>
              </div>
            </div>
          ))
        )}
        {carregando && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 shadow rounded-lg p-3 max-w-xs">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={fimMensagensRef} />
      </div>
      
      <form onSubmit={enviarMensagem} className="p-4 bg-white border-t flex items-center">
        <div className="relative">
          <label className="cursor-pointer mr-2 p-2 text-gray-600 hover:text-blue-600">
            <FiImage size={24} />
            <input
              type="file"
              onChange={alterarImagem}
              accept="image/*"
              className="hidden"
            />
          </label>
          {imagem && (
            <button
              type="button"
              onClick={removerImagem}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              title="Remover imagem"
            >
              <FiTrash2 size={12} />
            </button>
          )}
        </div>
        <input
          type="text"
          value={entrada}
          onChange={(e) => setEntrada(e.target.value)}
          placeholder={"Digite sua mensagem..."}
          className="flex-1 border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={carregando || (!entrada.trim() && !imagem)}
          className="ml-2 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title={"Enviar mensagem"}
        >
          <FiSend size={24} />
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
