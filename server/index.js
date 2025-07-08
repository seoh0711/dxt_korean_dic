#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const https = require('https');
const http = require('http');

class KoreanDictionaryServer {
  constructor() {
    this.server = new Server(
      {
        name: 'korean-dictionary-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.apiKey = process.env.API_KEY;
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_dictionary',
            description: '표준국어대사전에서 단어를 검색합니다',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: '검색할 단어나 구문',
                },
                searchType: {
                  type: 'string',
                  enum: ['word', 'definition', 'example'],
                  description: '검색 유형 (word: 표제어, definition: 뜻풀이, example: 용례)',
                  default: 'word',
                },
                pageSize: {
                  type: 'number',
                  description: '한 페이지당 결과 수 (1-100)',
                  minimum: 1,
                  maximum: 100,
                  default: 10,
                },
                page: {
                  type: 'number',
                  description: '페이지 번호',
                  minimum: 1,
                  default: 1,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_word_details',
            description: '특정 단어의 상세 정보를 조회합니다',
            inputSchema: {
              type: 'object',
              properties: {
                targetCode: {
                  type: 'string',
                  description: '조회할 단어의 대상 코드',
                },
              },
              required: ['targetCode'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'search_dictionary':
            return await this.searchDictionary(args);
          case 'get_word_details':
            return await this.getWordDetails(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `오류가 발생했습니다: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async searchDictionary(args) {
    const { query, searchType = 'word', pageSize = 10, page = 1 } = args;

    if (!this.apiKey) {
      throw new Error('API 키가 설정되지 않았습니다. 확장 프로그램 설정에서 API 키를 입력해주세요.');
    }

    const searchParams = new URLSearchParams({
      key: this.apiKey,
      q: query,
      req_type: 'json',
      part: searchType,
      sort: 'dict',
      start: ((page - 1) * pageSize + 1).toString(),
      num: pageSize.toString(),
    });

    const url = `https://stdict.korean.go.kr/api/search.do?${searchParams}`;

    try {
      const response = await this.makeHttpRequest(url);
      const data = JSON.parse(response);

      if (data.error) {
        throw new Error(`API 오류: ${data.error.message || '알 수 없는 오류'}`);
      }

      const results = data.channel?.item || [];
      const total = data.channel?.total || 0;

      let resultText = `🔍 검색 결과: "${query}"\n`;
      resultText += `📊 총 ${total}개 결과 중 ${results.length}개 표시 (페이지 ${page})\n\n`;

      if (total === 0 || results.length === 0) {
        resultText += '검색 결과가 없습니다.';
      } else {
        results.forEach((item, index) => {
          resultText += `${index + 1}. **${item.word}** (${item.pos || '품사 정보 없음'})\n`;
          
          // sense 객체에서 definition 추출
          const definition = item.sense?.definition || item.definition || '정의 없음';
          resultText += `   📝 ${definition}\n`;
          
          if (item.sense?.type) {
            resultText += `   🏷️ 유형: ${item.sense.type}\n`;
          }
          
          if (item.target_code) {
            resultText += `   🔗 상세 조회 코드: ${item.target_code}\n`;
          }
          
          if (item.sense?.link) {
            resultText += `   🌐 링크: ${item.sense.link}\n`;
          }
          
          resultText += '\n';
        });
      }

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      console.error('검색 API 오류:', error);
      throw new Error(`검색 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  async getWordDetails(args) {
    const { targetCode } = args;

    if (!this.apiKey) {
      throw new Error('API 키가 설정되지 않았습니다. 확장 프로그램 설정에서 API 키를 입력해주세요.');
    }

    const searchParams = new URLSearchParams({
      key: this.apiKey,
      method: 'target_code',
      req_type: 'json',
      target_code: targetCode,
    });

    const url = `https://stdict.korean.go.kr/api/view.do?${searchParams}`;

    try {
      const response = await this.makeHttpRequest(url);
      const data = JSON.parse(response);

      if (data.error) {
        throw new Error(`API 오류: ${data.error.message || '알 수 없는 오류'}`);
      }

      const item = data.channel?.item?.[0];
      if (!item) {
        throw new Error('해당 코드로 단어를 찾을 수 없습니다.');
      }

      let detailText = `📖 **${item.word}** 상세 정보\n\n`;

      if (item.pos) {
        detailText += `🏷️ **품사**: ${item.pos}\n`;
      }

      // sense 객체에서 정보 추출
      const definition = item.sense?.definition || item.definition;
      if (definition) {
        detailText += `📝 **뜻풀이**: ${definition}\n`;
      }

      if (item.sense?.type) {
        detailText += `🏷️ **유형**: ${item.sense.type}\n`;
      }

      if (item.sense?.link) {
        detailText += `🌐 **사전 링크**: ${item.sense.link}\n`;
      }

      // 기타 정보들 (실제 API 응답에 따라 조정)
      if (item.origin) {
        detailText += `🌍 **어원**: ${item.origin}\n`;
      }

      if (item.pronunciation) {
        detailText += `🔊 **발음**: ${item.pronunciation}\n`;
      }

      if (item.example) {
        detailText += `💬 **용례**: ${item.example}\n`;
      }

      if (item.reference) {
        detailText += `📚 **참고**: ${item.reference}\n`;
      }

      if (item.category) {
        detailText += `📂 **분야**: ${item.category}\n`;
      }

      if (item.target_code) {
        detailText += `🔗 **대상 코드**: ${item.target_code}\n`;
      }

      if (item.sup_no) {
        detailText += `🔢 **동음이의어 번호**: ${item.sup_no}\n`;
      }

      return {
        content: [
          {
            type: 'text',
            text: detailText,
          },
        ],
      };
    } catch (error) {
      console.error('상세 조회 API 오류:', error);
      throw new Error(`상세 정보 조회 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  makeHttpRequest(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;
      
      const request = protocol.get(url, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          }
        });
      });
      
      request.on('error', (error) => {
        reject(error);
      });
      
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('요청 시간이 초과되었습니다.'));
      });
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('표준국어대사전 MCP 서버가 시작되었습니다.');
  }
}

const server = new KoreanDictionaryServer();
server.run().catch(console.error); 