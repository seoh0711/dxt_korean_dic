# 표준국어대사전 Claude Desktop 확장 프로그램

이 확장 프로그램은 국립국어원의 표준국어대사전 오픈 API를 활용하여 Claude Desktop에서 한국어 단어를 검색하고 상세 정보를 조회할 수 있게 해줍니다.

## 주요 기능

- **단어 검색**: 표준국어대사전에서 한국어 단어를 검색
- **상세 조회**: 특정 단어의 상세 정보 (뜻풀이, 어원, 발음, 용례 등) 조회
- **다양한 검색 유형**: 표제어, 뜻풀이, 용례 기반 검색 지원
- **페이징 지원**: 검색 결과를 페이지별로 조회

## 사전 요구사항

1. **API 키 발급**: 표준국어대사전 오픈 API 키가 필요합니다.
   - [국립국어원 오픈 API 사이트](https://stdict.korean.go.kr/openapi/openApiInfo.do)에서 회원가입 후 API 키 발급
   - 개발자 등록 및 승인 과정이 필요할 수 있습니다.

2. **Claude Desktop**: 최신 버전의 Claude Desktop이 설치되어 있어야 합니다.

## 설치 방법

### 방법 1: DXT 파일 사용 (권장)
1. 이 저장소를 클론하거나 다운로드합니다.
2. 터미널에서 다음 명령어를 실행합니다:
   ```bash
   npm install -g @anthropic-ai/dxt
   dxt pack
   ```
3. 생성된 `.dxt` 파일을 Claude Desktop의 설정 창에 드래그앤드롭합니다.
4. API 키를 입력하고 확장 프로그램을 설치합니다.

### 방법 2: 수동 설치
1. 이 저장소를 클론합니다:
   ```bash
   git clone <repository-url>
   cd korean-dictionary-extension
   ```

2. 의존성을 설치합니다:
   ```bash
   npm install
   ```

3. Claude Desktop 설정 파일을 편집합니다:
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

4. 설정 파일에 다음 내용을 추가합니다:
   ```json
   {
     "mcpServers": {
       "korean-dictionary": {
         "command": "node",
         "args": ["경로/to/korean-dictionary-extension/server/index.js"],
         "env": {
           "API_KEY": "여기에_API_키_입력"
         }
       }
     }
   }
   ```

5. Claude Desktop을 재시작합니다.

## 사용 방법

확장 프로그램이 설치되면 Claude와 대화에서 다음과 같은 명령을 사용할 수 있습니다:

### 1. 단어 검색
```
"사랑"이라는 단어를 검색해줘
```

### 2. 상세 검색 옵션
```
"학습"을 뜻풀이 기준으로 검색해줘
```

### 3. 상세 정보 조회
```
대상 코드 "435977"의 상세 정보를 조회해줘
```

### 4. 페이징 검색
```
"한국어"를 20개씩 2페이지로 검색해줘
```

## 도구 설명

### search_dictionary
표준국어대사전에서 단어를 검색합니다.

**매개변수:**
- `query` (필수): 검색할 단어나 구문
- `searchType` (선택): 검색 유형
  - `word`: 표제어 검색 (기본값)
  - `definition`: 뜻풀이 검색
  - `example`: 용례 검색
- `pageSize` (선택): 한 페이지당 결과 수 (1-100, 기본값: 10)
- `page` (선택): 페이지 번호 (기본값: 1)

### get_word_details
특정 단어의 상세 정보를 조회합니다.

**매개변수:**
- `targetCode` (필수): 조회할 단어의 대상 코드

## API 정보

이 확장 프로그램은 다음 표준국어대사전 오픈 API를 사용합니다:

- **검색 API**: `https://stdict.korean.go.kr/api/search.do`
- **상세 조회 API**: `https://stdict.korean.go.kr/api/view.do`

자세한 API 문서는 [국립국어원 오픈 API 문서](https://stdict.korean.go.kr/openapi/openApiInfo.do)를 참조하세요.

## 문제 해결

### 일반적인 문제

1. **API 키 오류**: 
   - API 키가 올바르게 설정되었는지 확인
   - API 키가 활성화되었는지 국립국어원 사이트에서 확인

2. **검색 결과 없음**:
   - 검색어의 철자를 확인
   - 다른 검색 유형을 시도해보세요

3. **연결 오류**:
   - 인터넷 연결을 확인
   - 방화벽 설정을 확인

### 로그 확인
서버 로그는 Claude Desktop의 개발자 도구에서 확인할 수 있습니다.

## 기여하기

이 프로젝트에 기여하고 싶으시다면:

1. 이 저장소를 포크합니다
2. 새로운 브랜치를 생성합니다
3. 변경사항을 커밋합니다
4. 풀 리퀘스트를 생성합니다

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 지원

문제가 있거나 질문이 있으시면 GitHub Issues를 통해 문의해주세요. 