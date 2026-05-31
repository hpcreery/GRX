all: excellon.html excellon.pdf

excellon.html: excellon.md
	@pandoc $< -o $@

excellon.pdf.md: excellon.md
	@cat $< | sed 's/\.png/\.pdf/g' > $@

excellon.pdf: excellon.pdf.md
	@pandoc $< --latex-engine=pdflatex -o $@

clean: 
	@rm -f excellon.html excellon.pdf excellon.pdf.md
