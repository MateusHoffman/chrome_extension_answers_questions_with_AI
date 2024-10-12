chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "sendToLLM",
    title: "Configuração",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "sendToLLM") {
    // Injetar o script no content.js para enviar o texto selecionado
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: sendSelectedTextToLLM,
      args: [info.selectionText],
    });
  }
});

// Função que será injetada no content script para enviar o texto selecionado
function sendSelectedTextToLLM(selectedText) {
  const promptDefault =
    "1º Objetivo da Análise: Realizar uma análise crítica e detalhada do texto a seguir. Identificar a alternativa correta com base na análise realizada. 2º Condições Linguísticas: Utilizar exclusivamente o português brasileiro. Adotar uma linguagem clara, formal e precisa, evitando ambiguidade e coloquialismos. 3º Etapas do Processo de Análise: Leitura Atenta: Ler cada sentença do texto cuidadosamente, sem pressa. Identificar termos e expressões-chave que possam influenciar a interpretação. Reavaliação Crítica: Reexaminar as informações apresentadas com um olhar analítico. Considerar o contexto e a intenção do autor ao redigir o texto. Identificação de Inconsistências: Identificar e classificar informações como corretas ou incorretas. Analisar possíveis contradições, ambiguidades ou falhas lógicas nas afirmações. 4º Critérios de Avaliação Detalhados: Coerência: Avaliar a lógica e a conexão entre as afirmações. Verificar se o texto apresenta um fluxo de ideias consistente e articulado. Clareza: Analisar a facilidade de compreensão das sentenças. Identificar jargões, termos técnicos ou expressões que possam dificultar a compreensão. Conformidade: Confirmar se as informações estão em consonância com o texto original, quando aplicável. Comparar as afirmações com referências ou conhecimentos previamente estabelecidos, garantindo a precisão. 5º Instruções para a Resposta: Apresentar exclusivamente a letra da alternativa correta, sem exceções. Não incluir explicações, justificativas ou qualquer outro tipo de comentário. Assegurar que a resposta seja diretamente relacionada à análise realizada e que esteja clara e precisa. 6º Considerações Finais: Lembrar que a precisão e a objetividade na análise são fundamentais. Manter um foco claro na busca pela alternativa correta, evitando distrações e elaborando uma resposta concisa. Reiterar a importância de uma análise imparcial e objetiva, baseando-se apenas no conteúdo apresentado. A SEGUIR VEM O TEXTO QUE É UMA QUESTÃO COM ENUNCIADO, PERGUNTA E ALTERNATIVAS, SENDO APENAS UMA ALTERNATIVA A CORRETA: ATENÇÃO A RESPOSTA FINAL DEVE SER APENAS 1 LETRA, A LETRA DA ALTERNATIVA CORRETA, A RESPOSTA DEVE SER APENAS UMA LETRA";
  const requestBody = {
    model: "llama3.1:8b",
    stream: false,
    prompt: promptDefault + selectedText,
  };

  // Criar elemento de carregamento
  const loadingElement = document.createElement("div");
  loadingElement.innerText = "...";
  loadingElement.style.position = "fixed";
  loadingElement.style.bottom = "20px"; // distância do fundo
  loadingElement.style.left = "20px"; // distância da esquerda
  loadingElement.style.zIndex = "1000";

  // Adicionar o elemento de carregamento ao corpo
  document.body.appendChild(loadingElement);

  // Fazer requisição para a API LLM
  fetch("http://localhost:3000/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("data.response: ", data.response);
      showModal(data.response);
    })
    .catch((error) => {
      console.error("Erro ao conectar com a API LLM:", error);
    })
    .finally(() => {
      // Remover o elemento de carregamento
      if (loadingElement) {
        document.body.removeChild(loadingElement);
      }
    });

  // Função para exibir a resposta em um modal
  function showModal(response) {
    // Cria o modal
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.bottom = "20px";
    modal.style.left = "20px";
    modal.style.zIndex = "1000";
    modal.innerHTML = `<p>${response}</p>`;

    // Cria um overlay para fechar o modal ao clicar fora
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.zIndex = "999"; // Z-index do overlay deve ser menor que o do modal

    // Adiciona os elementos ao corpo
    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    // Fecha o modal quando o overlay é clicado
    overlay.onclick = function () {
      document.body.removeChild(modal);
      document.body.removeChild(overlay);
    };
  }
}
