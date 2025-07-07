#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

// 네이버 API 설정
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
  console.error("네이버 클라이언트 ID와 시크릿이 필요합니다.");
  process.exit(1);
}

// 네이버 API 기본 설정
const naverApiConfig = {
  headers: {
    "X-Naver-Client-Id": NAVER_CLIENT_ID,
    "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    "User-Agent": "Mozilla/5.0 (compatible; NaverAPIBot/1.0)",
  },
};

class NaverAPIServer {
  constructor() {
    this.server = new Server(
      {
        name: "naver-api-extension",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // 오류 처리
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    // 도구 목록 제공
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "search_blog",
            description: "네이버 블로그를 검색합니다",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "검색할 키워드",
                },
                display: {
                  type: "number",
                  description: "검색 결과 개수 (1-100, 기본값: 10)",
                  default: 10,
                },
                start: {
                  type: "number",
                  description: "검색 시작 위치 (1-1000, 기본값: 1)",
                  default: 1,
                },
                sort: {
                  type: "string",
                  description: "정렬 방식 (sim: 정확도순, date: 날짜순)",
                  enum: ["sim", "date"],
                  default: "sim",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "search_news",
            description: "네이버 뉴스를 검색합니다",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "검색할 키워드",
                },
                display: {
                  type: "number",
                  description: "검색 결과 개수 (1-100, 기본값: 10)",
                  default: 10,
                },
                start: {
                  type: "number",
                  description: "검색 시작 위치 (1-1000, 기본값: 1)",
                  default: 1,
                },
                sort: {
                  type: "string",
                  description: "정렬 방식 (sim: 정확도순, date: 날짜순)",
                  enum: ["sim", "date"],
                  default: "sim",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "search_book",
            description: "네이버 책을 검색합니다",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "검색할 키워드",
                },
                display: {
                  type: "number",
                  description: "검색 결과 개수 (1-100, 기본값: 10)",
                  default: 10,
                },
                start: {
                  type: "number",
                  description: "검색 시작 위치 (1-1000, 기본값: 1)",
                  default: 1,
                },
                sort: {
                  type: "string",
                  description: "정렬 방식 (sim: 정확도순, date: 출간일순, count: 판매량순)",
                  enum: ["sim", "date", "count"],
                  default: "sim",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "search_encyclopedia",
            description: "네이버 백과사전을 검색합니다",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "검색할 키워드",
                },
                display: {
                  type: "number",
                  description: "검색 결과 개수 (1-100, 기본값: 10)",
                  default: 10,
                },
                start: {
                  type: "number",
                  description: "검색 시작 위치 (1-1000, 기본값: 1)",
                  default: 1,
                },
              },
              required: ["query"],
            },
          },
          {
            name: "search_movie",
            description: "네이버 영화를 검색합니다",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "검색할 키워드",
                },
                display: {
                  type: "number",
                  description: "검색 결과 개수 (1-100, 기본값: 10)",
                  default: 10,
                },
                start: {
                  type: "number",
                  description: "검색 시작 위치 (1-1000, 기본값: 1)",
                  default: 1,
                },
                genre: {
                  type: "number",
                  description: "장르 코드 (1: 드라마, 2: 판타지, 3: 서부, 4: 공포, 5: 로맨스, 6: 모험, 7: 스릴러, 8: 느와르, 9: 컬트, 10: 다큐멘터리, 11: 코미디, 12: 가족, 13: 미스터리, 14: 전쟁, 15: 애니메이션, 16: 범죄, 17: 뮤지컬, 18: SF, 19: 액션, 20: 무협, 21: 에로, 22: 서스펜스, 23: 서사, 24: 블랙코미디, 25: 실험, 26: 영화카툰, 27: 영화음악, 28: 영화패러디포스터)",
                },
                country: {
                  type: "string",
                  description: "국가 코드 (KR: 한국, US: 미국, JP: 일본, 등)",
                },
                yearfrom: {
                  type: "number",
                  description: "제작년도 시작 (1900-2200)",
                },
                yearto: {
                  type: "number",
                  description: "제작년도 끝 (1900-2200)",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "search_webkr",
            description: "네이버 웹문서를 검색합니다",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "검색할 키워드",
                },
                display: {
                  type: "number",
                  description: "검색 결과 개수 (1-100, 기본값: 10)",
                  default: 10,
                },
                start: {
                  type: "number",
                  description: "검색 시작 위치 (1-1000, 기본값: 1)",
                  default: 1,
                },
              },
              required: ["query"],
            },
          },
          {
            name: "search_image",
            description: "네이버 이미지를 검색합니다",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "검색할 키워드",
                },
                display: {
                  type: "number",
                  description: "검색 결과 개수 (1-100, 기본값: 10)",
                  default: 10,
                },
                start: {
                  type: "number",
                  description: "검색 시작 위치 (1-1000, 기본값: 1)",
                  default: 1,
                },
                sort: {
                  type: "string",
                  description: "정렬 방식 (sim: 정확도순, date: 날짜순)",
                  enum: ["sim", "date"],
                  default: "sim",
                },
                filter: {
                  type: "string",
                  description: "이미지 필터 (all: 전체, large: 큰 이미지, medium: 중간 이미지, small: 작은 이미지)",
                  enum: ["all", "large", "medium", "small"],
                  default: "all",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "search_shop",
            description: "네이버 쇼핑을 검색합니다",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "검색할 키워드",
                },
                display: {
                  type: "number",
                  description: "검색 결과 개수 (1-100, 기본값: 10)",
                  default: 10,
                },
                start: {
                  type: "number",
                  description: "검색 시작 위치 (1-1000, 기본값: 1)",
                  default: 1,
                },
                sort: {
                  type: "string",
                  description: "정렬 방식 (sim: 정확도순, date: 날짜순, asc: 가격오름차순, dsc: 가격내림차순)",
                  enum: ["sim", "date", "asc", "dsc"],
                  default: "sim",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "datalab_search_trend",
            description: "데이터랩 검색어 트렌드를 조회합니다",
            inputSchema: {
              type: "object",
              properties: {
                startDate: {
                  type: "string",
                  description: "시작 날짜 (YYYY-MM-DD 형식)",
                },
                endDate: {
                  type: "string",
                  description: "종료 날짜 (YYYY-MM-DD 형식)",
                },
                timeUnit: {
                  type: "string",
                  description: "시간 단위 (date: 일간, week: 주간, month: 월간)",
                  enum: ["date", "week", "month"],
                  default: "date",
                },
                keywordGroups: {
                  type: "array",
                  description: "검색어 그룹 배열",
                  items: {
                    type: "object",
                    properties: {
                      groupName: {
                        type: "string",
                        description: "그룹명",
                      },
                      keywords: {
                        type: "array",
                        description: "키워드 배열",
                        items: {
                          type: "string",
                        },
                      },
                    },
                    required: ["groupName", "keywords"],
                  },
                },
                device: {
                  type: "string",
                  description: "기기 구분 (pc: PC, mo: 모바일, 빈 문자열: 전체)",
                  enum: ["", "pc", "mo"],
                  default: "",
                },
                ages: {
                  type: "array",
                  description: "연령대 배열 (1: 0~12세, 2: 13~18세, 3: 19~24세, 4: 25~29세, 5: 30~34세, 6: 35~39세, 7: 40~44세, 8: 45~49세, 9: 50~54세, 10: 55~59세, 11: 60세 이상)",
                  items: {
                    type: "string",
                  },
                },
                gender: {
                  type: "string",
                  description: "성별 (빈 문자열: 전체, f: 여성, m: 남성)",
                  enum: ["", "f", "m"],
                  default: "",
                },
              },
              required: ["startDate", "endDate", "keywordGroups"],
            },
          },
          {
            name: "test_api_connection",
            description: "네이버 API 연결 상태를 테스트합니다",
            inputSchema: {
              type: "object",
              properties: {
                testType: {
                  type: "string",
                  description: "테스트할 API 유형 (search: 검색API, datalab: 데이터랩API)",
                  enum: ["search", "datalab"],
                  default: "search",
                },
              },
            },
          },
          {
            name: "get_datalab_guide",
            description: "데이터랩 API 사용 가이드 및 권한 신청 방법을 안내합니다",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "datalab_shopping_insight",
            description: "데이터랩 쇼핑 인사이트를 조회합니다",
            inputSchema: {
              type: "object",
              properties: {
                startDate: {
                  type: "string",
                  description: "시작 날짜 (YYYY-MM-DD 형식)",
                },
                endDate: {
                  type: "string",
                  description: "종료 날짜 (YYYY-MM-DD 형식)",
                },
                timeUnit: {
                  type: "string",
                  description: "시간 단위 (date: 일간, week: 주간, month: 월간)",
                  enum: ["date", "week", "month"],
                  default: "month",
                },
                category: {
                  type: "string",
                  description: "카테고리 (예: 50000000 - 생활/건강)",
                },
                keyword: {
                  type: "string",
                  description: "키워드",
                },
                device: {
                  type: "string",
                  description: "기기 구분 (pc: PC, mo: 모바일, 빈 문자열: 전체)",
                  enum: ["", "pc", "mo"],
                  default: "",
                },
                ages: {
                  type: "array",
                  description: "연령대 배열",
                  items: {
                    type: "string",
                  },
                },
                gender: {
                  type: "string",
                  description: "성별 (빈 문자열: 전체, f: 여성, m: 남성)",
                  enum: ["", "f", "m"],
                  default: "",
                },
              },
              required: ["startDate", "endDate"],
            },
          },
        ],
      };
    });

    // 도구 실행 처리
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "search_blog":
            return await this.searchBlog(args);
          case "search_news":
            return await this.searchNews(args);
          case "search_book":
            return await this.searchBook(args);
          case "search_encyclopedia":
            return await this.searchEncyclopedia(args);
          case "search_movie":
            return await this.searchMovie(args);
          case "search_webkr":
            return await this.searchWebkr(args);
          case "search_image":
            return await this.searchImage(args);
          case "search_shop":
            return await this.searchShop(args);
          case "test_api_connection":
            return await this.testApiConnection(args);
          case "get_datalab_guide":
            return await this.getDatalabGuide(args);
          case "datalab_search_trend":
            return await this.datalabSearchTrend(args);
          case "datalab_shopping_insight":
            return await this.datalabShoppingInsight(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `알 수 없는 도구: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `도구 실행 중 오류 발생: ${error.message}`
        );
      }
    });
  }

  // API 연결 테스트
  async testApiConnection(args) {
    const { testType = "search" } = args;
    
    try {
      let testResult = {
        clientId: NAVER_CLIENT_ID ? "설정됨" : "설정되지 않음",
        clientSecret: NAVER_CLIENT_SECRET ? "설정됨" : "설정되지 않음",
        tests: []
      };

      if (testType === "search") {
        // 검색 API 테스트
        try {
          const response = await axios.get("https://openapi.naver.com/v1/search/blog", {
            ...naverApiConfig,
            params: { query: "테스트", display: 1 },
          });
          testResult.tests.push({
            api: "검색 API (블로그)",
            status: "성공",
            statusCode: response.status,
            message: "정상 작동"
          });
        } catch (error) {
          testResult.tests.push({
            api: "검색 API (블로그)",
            status: "실패",
            statusCode: error.response?.status || "N/A",
            message: error.message,
            details: error.response?.data || "응답 데이터 없음"
          });
        }
      } else if (testType === "datalab") {
        // 데이터랩 API 테스트
        try {
          const requestBody = {
            startDate: "2024-01-01",
            endDate: "2024-01-07",
            timeUnit: "date",
            keywordGroups: [{
              groupName: "테스트",
              keywords: ["테스트"]
            }]
          };

          const datalabConfig = {
            ...naverApiConfig,
            headers: {
              ...naverApiConfig.headers,
              "Content-Type": "application/json",
            },
          };

          const response = await axios.post(
            "https://openapi.naver.com/v1/datalab/search",
            requestBody,
            datalabConfig
          );
          
          testResult.tests.push({
            api: "데이터랩 API (검색어 트렌드)",
            status: "성공",
            statusCode: response.status,
            message: "정상 작동"
          });
        } catch (error) {
          testResult.tests.push({
            api: "데이터랩 API (검색어 트렌드)",
            status: "실패",
            statusCode: error.response?.status || "N/A",
            message: error.message,
            details: error.response?.data || "응답 데이터 없음"
          });
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(testResult, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `API 연결 테스트 실패: ${error.message}`
      );
    }
  }

  // 데이터랩 API 가이드
  async getDatalabGuide(args) {
    const guide = {
      title: "네이버 데이터랩 API 사용 가이드",
      description: "데이터랩 API는 별도의 승인이 필요한 고급 API입니다.",
      steps: [
        {
          step: 1,
          title: "네이버 개발자 센터 접속",
          description: "https://developers.naver.com/ 접속 후 로그인"
        },
        {
          step: 2,
          title: "애플리케이션 등록/수정",
          description: "내 애플리케이션에서 기존 앱을 수정하거나 새로 등록"
        },
        {
          step: 3,
          title: "데이터랩 API 신청",
          description: "사용 API에서 '데이터랩'을 선택하고 신청"
        },
        {
          step: 4,
          title: "승인 대기",
          description: "네이버 검토 후 승인 (보통 1-3일 소요)"
        },
        {
          step: 5,
          title: "API 사용 시작",
          description: "승인 후 데이터랩 API 사용 가능"
        }
      ],
      requirements: {
        title: "데이터랩 API 신청 시 필요 정보",
        items: [
          "서비스 이름 및 설명",
          "사용 목적 (개인 프로젝트, 상업적 이용 등)",
          "예상 사용량",
          "개발자 연락처"
        ]
      },
      limitations: {
        title: "데이터랩 API 제한사항",
        items: [
          "검색어 트렌드: 최소 7일 이상의 기간 필요",
          "키워드 그룹: 최대 5개 그룹",
          "각 그룹당 키워드: 최대 20개",
          "일일 호출 제한: 승인 시 안내",
          "상업적 이용 시 별도 계약 필요할 수 있음"
        ]
      },
      troubleshooting: {
        title: "401 오류 해결 방법",
        items: [
          "클라이언트 ID/시크릿 재확인",
          "데이터랩 API 승인 상태 확인",
          "API 사용 설정에서 데이터랩 체크 확인",
          "도메인/IP 제한 설정 확인"
        ]
      },
      contact: {
        title: "문의처",
        items: [
          "네이버 개발자 센터 고객센터",
          "개발자 포럼: https://developers.naver.com/forum",
          "이메일: naver_api@navercorp.com"
        ]
      }
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(guide, null, 2),
        },
      ],
    };
  }

  // 네이버 블로그 검색
  async searchBlog(args) {
    const { query, display = 10, start = 1, sort = "sim" } = args;
    
    try {
      const response = await axios.get("https://openapi.naver.com/v1/search/blog", {
        ...naverApiConfig,
        params: { query, display, start, sort },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `블로그 검색 실패: ${error.message}`
      );
    }
  }

  // 네이버 뉴스 검색
  async searchNews(args) {
    const { query, display = 10, start = 1, sort = "sim" } = args;
    
    try {
      const response = await axios.get("https://openapi.naver.com/v1/search/news", {
        ...naverApiConfig,
        params: { query, display, start, sort },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `뉴스 검색 실패: ${error.message}`
      );
    }
  }

  // 네이버 책 검색
  async searchBook(args) {
    const { query, display = 10, start = 1, sort = "sim" } = args;
    
    try {
      const response = await axios.get("https://openapi.naver.com/v1/search/book", {
        ...naverApiConfig,
        params: { query, display, start, sort },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `책 검색 실패: ${error.message}`
      );
    }
  }

  // 네이버 백과사전 검색
  async searchEncyclopedia(args) {
    const { query, display = 10, start = 1 } = args;
    
    try {
      const response = await axios.get("https://openapi.naver.com/v1/search/encyc", {
        ...naverApiConfig,
        params: { query, display, start },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `백과사전 검색 실패: ${error.message}`
      );
    }
  }

  // 네이버 영화 검색
  async searchMovie(args) {
    const { query, display = 10, start = 1, genre, country, yearfrom, yearto } = args;
    
    try {
      const params = { query, display, start };
      if (genre) params.genre = genre;
      if (country) params.country = country;
      if (yearfrom) params.yearfrom = yearfrom;
      if (yearto) params.yearto = yearto;

      const response = await axios.get("https://openapi.naver.com/v1/search/movie", {
        ...naverApiConfig,
        params,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `영화 검색 실패: ${error.message}`
      );
    }
  }

  // 네이버 웹문서 검색
  async searchWebkr(args) {
    const { query, display = 10, start = 1 } = args;
    
    try {
      const response = await axios.get("https://openapi.naver.com/v1/search/webkr", {
        ...naverApiConfig,
        params: { query, display, start },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `웹문서 검색 실패: ${error.message}`
      );
    }
  }

  // 네이버 이미지 검색
  async searchImage(args) {
    const { query, display = 10, start = 1, sort = "sim", filter = "all" } = args;
    
    try {
      const response = await axios.get("https://openapi.naver.com/v1/search/image", {
        ...naverApiConfig,
        params: { query, display, start, sort, filter },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `이미지 검색 실패: ${error.message}`
      );
    }
  }

  // 네이버 쇼핑 검색
  async searchShop(args) {
    const { query, display = 10, start = 1, sort = "sim" } = args;
    
    try {
      const response = await axios.get("https://openapi.naver.com/v1/search/shop", {
        ...naverApiConfig,
        params: { query, display, start, sort },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `쇼핑 검색 실패: ${error.message}`
      );
    }
  }

  // 데이터랩 검색어 트렌드
  async datalabSearchTrend(args) {
    const { startDate, endDate, timeUnit = "date", keywordGroups, device = "", ages = [], gender = "" } = args;
    
    try {
      const requestBody = {
        startDate,
        endDate,
        timeUnit,
        keywordGroups,
        device,
        ages,
        gender,
      };

      // 디버깅용 로그
      console.error("데이터랩 API 요청 데이터:", JSON.stringify(requestBody, null, 2));
      console.error("네이버 클라이언트 ID:", NAVER_CLIENT_ID ? "설정됨" : "설정되지 않음");

      const datalabConfig = {
        ...naverApiConfig,
        headers: {
          ...naverApiConfig.headers,
          "Content-Type": "application/json",
        },
      };

      const response = await axios.post(
        "https://openapi.naver.com/v1/datalab/search",
        requestBody,
        datalabConfig
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      // 더 자세한 오류 정보 제공
      let errorMessage = `데이터랩 검색어 트렌드 조회 실패: ${error.message}`;
      if (error.response) {
        errorMessage += ` (상태 코드: ${error.response.status})`;
        if (error.response.data) {
          errorMessage += ` - ${JSON.stringify(error.response.data)}`;
        }
      }
      
      throw new McpError(
        ErrorCode.InternalError,
        errorMessage
      );
    }
  }

  // 데이터랩 쇼핑 인사이트
  async datalabShoppingInsight(args) {
    const { startDate, endDate, timeUnit = "month", category, keyword, device = "", ages = [], gender = "" } = args;
    
    try {
      const requestBody = {
        startDate,
        endDate,
        timeUnit,
        category,
        keyword,
        device,
        ages,
        gender,
      };

      const datalabConfig = {
        ...naverApiConfig,
        headers: {
          ...naverApiConfig.headers,
          "Content-Type": "application/json",
        },
      };

      const response = await axios.post(
        "https://openapi.naver.com/v1/datalab/shopping/categories",
        requestBody,
        datalabConfig
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      // 더 자세한 오류 정보 제공
      let errorMessage = `데이터랩 쇼핑 인사이트 조회 실패: ${error.message}`;
      if (error.response) {
        errorMessage += ` (상태 코드: ${error.response.status})`;
        if (error.response.data) {
          errorMessage += ` - ${JSON.stringify(error.response.data)}`;
        }
      }
      
      throw new McpError(
        ErrorCode.InternalError,
        errorMessage
      );
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("네이버 API MCP 서버가 시작되었습니다.");
  }
}

const server = new NaverAPIServer();
server.run().catch(console.error); 