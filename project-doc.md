## Plano de 10 Passos para o Projeto "App Gasolina"

1. **Estrutura Inicial do Projeto**
   - Crie os arquivos `index.html`, `script.js` e `style.css`.
   - Importe o Bootstrap e os ícones necessários no HTML.
   - Estruture o HTML com um layout básico e links para os arquivos JS/CSS.

2. **Tela de Login**
   - Implemente uma tela de login simples no `index.html`.
   - Permita login por usuário e PIN.
   - Use o endpoint SheetDB `/usuarios` para validar o login.

3. **Controle de Sessão e Tipos de Usuário**
   - Após login, salve o tipo de usuário (M ou A) em localStorage.
   - Redirecione para a tela de registro de abastecimento (M) ou relatórios (A).

4. **Tela de Registro de Abastecimento**
   - Crie um formulário para registrar abastecimentos.
   - Busque e preencha os selects de veículos e postos usando SheetDB (`/veiculos` e `/postos`).
   - Envie os dados para SheetDB `/abastecimentos` via fetch.

5. **Validação e Feedback**
   - Implemente validação dos campos do formulário.
   - Mostre mensagens de sucesso ou erro ao registrar abastecimento.

6. **Tela de Relatórios (Admin)**
   - Crie uma tela para listar todos os abastecimentos.
   - Busque os dados de `/abastecimentos` e relacione com `/usuarios`, `/veiculos` e `/postos` para exibir informações completas.

7. **Filtro e Busca nos Relatórios**
   - Adicione filtros por usuário, veículo, posto e período.
   - Implemente busca dinâmica nos relatórios.

8. **Estilização com Bootstrap**
   - Aplique estilos do Bootstrap para tornar a interface amigável.
   - Utilize ícones para melhorar a usabilidade.

9. **Controle de Logout e Segurança Simples**
   - Adicione botão de logout.
   - Limpe a sessão e retorne para a tela de login ao sair.

10. **Testes Finais e Ajustes**
    - Teste todos os fluxos (login, registro, relatórios, logout).
    - Corrija bugs e faça ajustes de usabilidade e layout.

---

**Observações:**
- O endpoint base do SheetDB é: `https://sheetdb.io/api/v1/6db94sirura40`
- Para acessar uma planilha específica, adicione o nome ao final da URL, por exemplo: `/usuarios`, `/veiculos`, `/postos`, `/abastecimentos`.
- Use `fetch` com `async/await` para todas as operações de leitura e escrita.
