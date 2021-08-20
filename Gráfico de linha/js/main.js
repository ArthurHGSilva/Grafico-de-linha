// definindo as margens
const MARGIN = { LEFT: 60, RIGHT: 100, TOP: 50, BOTTOM: 100 }
const WIDTH = 800 - MARGIN.LEFT - MARGIN.RIGHT
const HEIGHT = 500 - MARGIN.TOP - MARGIN.BOTTOM

// adicionando o svg canvas
const svg = d3.select("#chart-area").append("svg")
  .attr("width", WIDTH + MARGIN.LEFT + MARGIN.RIGHT)
  .attr("height", HEIGHT + MARGIN.TOP + MARGIN.BOTTOM)

// adicionando um grupo ao canvas e ajustando as margens esquerda e superior
  const g = svg.append("g")
  .attr("transform", `translate(${MARGIN.LEFT}, ${MARGIN.TOP})`)

// timeParse é utilizado para conversão de dados entre strings e data objects - no caso os anos
const parseTime = d3.timeParse("%Y")

// função que permite, a partir de determinado ponto, retornar o valor do índice 
const bisectDate = d3.bisector(d => d.year).left

// criação das escalas - definindo a range para as escalas x e y
const x = d3.scaleTime().range([0, WIDTH]) // ano
const y = d3.scaleLinear().range([HEIGHT, 0]) // valor

// Label - texto no eixo x
const xLabel = g.append("text")
	.attr("y", HEIGHT + 50)
	.attr("x", WIDTH / 2)
	.attr("font-size", "20px")
	.attr("text-anchor", "middle")
	.text("Anos")

// Label - texto no eixo y
const yLabel = g.append("text")
	.attr("transform", "rotate(-90)")
	.attr("y", -40)
	.attr("x", -170)
	.attr("font-size", "20px")
	.attr("text-anchor", "middle")
	.text("Valor em reais (R$)")

// axis - geradores (Definifição da posição do eixo x e y)
const xAxisCall = d3.axisBottom() // eixo da parte de baixo
const yAxisCall = d3.axisLeft() // eixo da esquerda

// axis - grupo
// Adicionando dois grupos para conter os eixos
const xAxis = g.append("g")
	.attr("class", "x axis")
	.attr("transform", `translate(0, ${HEIGHT})`)
const yAxis = g.append("g")
	.attr("class", "y axis")
    

// criação da linha gráfica - gerador para trajetórias de linha
const line = d3.line()
	.x(d => x(d.year)) // função de escala - para cada elemento "year" executará a função de escala x e retona em valor de x
	.y(d => y(d.value)) // igual ao x

// Carregando os dados a partir do arquivo data.json (gerando a promise)
d3.json("data/data.json").then(data => {
	data.forEach(d => {
		// transforma uma string em um data object
		d.year = parseTime(d.year) // convertendo a string em data object
		d.value = Number(d.value) // convertendo a string em int
	})

	// definindo a parte do domínio 
	x.domain(d3.extent(data, d => d.year)) // extent - irá pegar o menor ano e o maior ano para o domain
	y.domain([
		d3.min(data, d => d.value) / 1.005, // irá pegar o menor valor e divide para abrir um pequeno espaço no inicío do eixo y
		d3.max(data, d => d.value) * 1.005 // irá pegar o maior valor e multiplicar para abrir um pequeno espaço no final do eixo y
	])

	// chama os geradores de eixo
	xAxis.call(xAxisCall.scale(x))
	yAxis.call(yAxisCall.scale(y))

	// adiciona a linha no gráfico
	g.append("path") // adiciona o caminho
		.attr("class", "line")
		.attr("fill", "none")
		.attr("stroke", "grey")
		.attr("stroke-width", "3px")
		.attr("d", line(data)) // chamando a função linha com os dados carregados na promise

	// Adiciona um grupo para exibir ou esconder o tooltip
	const focus = g.append("g") // adicionar o marcador ao grupo
		.attr("class", "focus") // cria uma classe para estilização
		.style("display", "none")

	// Adição da linha vertical para conectar ao eixo x
	focus.append("line")
		.attr("class", "x-hover-line hover-line")
		.attr("y1", 0) // indica a posição
		.attr("y2", HEIGHT) // indica a posição

	// Adição da linha horizontal para conectar ao eixo y
	focus.append("line")
		.attr("class", "y-hover-line hover-line")
		.attr("x1", 0) // indica a posição
		.attr("x2", WIDTH) // indica a posição

	// Adição do cículo na "junção" entre os pontos - marcador
	focus.append("circle")
		.attr("r", 7) // tamanho do marcador

	// Adição do texto correspondente ao número do encontro entre as linhas 
	focus.append("text")
		.attr("x", 15) // distância do texto em relação ao marcador
		.attr("dy", ".31em")

	// Adiciona um retângulo invisível para fazer a visualização 
	g.append("rect")
		.attr("class", "overlay")
		.attr("width", WIDTH)
		.attr("height", HEIGHT)
		.on("mouseover", () => focus.style("display", null)) // Quando este retângulo for acionado (com o mouse), entra em ação o focus
		.on("mouseout", () => focus.style("display", "none")) // Quando o mouse sai do retângulo, o focus não é mostrado 
		.on("mousemove", mousemove) // chama a função abaixo

	// Função responsável por atualizar o tooltip quando o mouse está em movimento
	function mousemove() {
		const x0 = x.invert(d3.mouse(this)[0]) //Obtém a posição atual x do mouse
		const i = bisectDate(data, x0, 1) //Obtém o index do vetor de dados correspondentes
		const d0 = data[i - 1] //Inicializa a variável com o dado anterior
		const d1 = data[i] //Inicializa a variável com o dado posterior
		const d = x0 - d0.year > d1.year - x0 ? d1 : d0 //Retorna o valor do ponto que está mais próximo em relação a posição do mouse
		focus.attr("transform", `translate(${x(d.year)}, ${y(d.value)})`) //Muda a posição do tooltip
		focus.select("text").text(d.value) //Atualiza o texto com a posição da tooltip
		focus.select(".x-hover-line").attr("y2", HEIGHT - y(d.value)) //Informações necessárias para desenhar a linha pontilhada no eixo x
		focus.select(".y-hover-line").attr("x2", -x(d.year))// Informações necessárias para desenhar a linha pontilhada no eixo y
	}
	

})
