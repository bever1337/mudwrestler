<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="text" encoding="utf-8" />
  <xsl:template match="/">
    <xsl:text>{"areas":{</xsl:text>
    <xsl:for-each select="/map/areas/area">
      <xsl:text>"</xsl:text>
      <xsl:value-of select="@id" />
      <xsl:text>":{"id":"</xsl:text>
      <xsl:value-of select="@id" />
      <xsl:text>","name":"</xsl:text>
      <xsl:value-of select="@name" />
      <xsl:text>","x":"</xsl:text>
      <xsl:value-of select="@x" />
      <xsl:text>","y":"</xsl:text>
      <xsl:value-of select="@y" />
      <xsl:text>"}</xsl:text>
      <xsl:choose>
        <xsl:when test="position() != last()">
          <xsl:text>,</xsl:text>
        </xsl:when>
      </xsl:choose>
    </xsl:for-each>
    <xsl:text>},"area_keys":[</xsl:text>
    <xsl:for-each select="/map/areas/area">
      <xsl:text>"</xsl:text>
      <xsl:value-of select="@id" />
      <xsl:text>"</xsl:text>
      <xsl:choose>
        <xsl:when test="position() != last()">,</xsl:when>
      </xsl:choose>
    </xsl:for-each>
    <xsl:for-each select="/map/areas/area"></xsl:for-each>
    <xsl:text>],"environments":{</xsl:text>
    <xsl:for-each select="/map/environments/environment">
      <xsl:text>"</xsl:text>
      <xsl:value-of select="@id" />
      <xsl:text>":{</xsl:text>
      <xsl:text>"color":"</xsl:text>
      <xsl:value-of select="@color" />
      <xsl:text>","htmlcolor":"</xsl:text>
      <xsl:value-of select="@htmlcolor" />
      <xsl:text>","id":"</xsl:text>
      <xsl:value-of select="@id" />
      <xsl:text>","name":"</xsl:text>
      <xsl:value-of select="@name" />
      <xsl:text>"}</xsl:text>
      <xsl:choose>
        <xsl:when test="position() != last()">
          <xsl:text>,</xsl:text>
        </xsl:when>
      </xsl:choose>
    </xsl:for-each>
    <xsl:text>},"environment_keys":[</xsl:text>
    <xsl:for-each select="/map/environments/environment">
      <xsl:text>"</xsl:text>
      <xsl:value-of select="@id" />
      <xsl:text>"</xsl:text>
      <xsl:choose>
        <xsl:when test="position() != last()">,</xsl:when>
      </xsl:choose>
    </xsl:for-each>
    <xsl:text>],"exits":{</xsl:text>
    <xsl:for-each select="/map/rooms/room/exit">
      <xsl:text>"</xsl:text>
      <xsl:value-of select="../@id" />
      <xsl:text>_</xsl:text>
      <xsl:value-of select="@target" />
      <xsl:text>":{</xsl:text>
      <xsl:text>"direction":"</xsl:text>
      <xsl:value-of select="@direction" />
      <xsl:text>","id":"</xsl:text>
      <xsl:value-of select="../@id" />
      <xsl:text>_</xsl:text>
      <xsl:value-of select="@target" />
      <xsl:text>",</xsl:text>
      <xsl:text>"room":"</xsl:text>
      <xsl:value-of select="../@id" />
      <xsl:text>","targetRoom":"</xsl:text>
      <xsl:value-of select="@target" />
      <xsl:text>","targetArea":"</xsl:text>
      <xsl:value-of select="@tgarea" />
      <xsl:text>"}</xsl:text>
      <xsl:choose>
        <xsl:when test="position() != last()">,</xsl:when>
      </xsl:choose>
    </xsl:for-each>
    <xsl:text>},"exit_keys":[</xsl:text>
    <xsl:for-each select="/map/rooms/room/exit">
      <xsl:text>"</xsl:text>
      <xsl:value-of select="../@id" />
      <xsl:text>_</xsl:text>
      <xsl:value-of select="@target" />
      <xsl:text>"</xsl:text>
      <xsl:choose>
        <xsl:when test="position() != last()">,</xsl:when>
      </xsl:choose>
    </xsl:for-each>
    <xsl:text>],"rooms":{</xsl:text>
    <xsl:for-each select="/map/rooms/room">
      <xsl:text>"</xsl:text>
      <xsl:value-of select="@id" />
      <xsl:text>":{</xsl:text>
      <xsl:text>"area":"</xsl:text>
      <xsl:value-of select="@area" />
      <xsl:text>","environment":"</xsl:text>
      <xsl:value-of select="@environment" />
      <xsl:text>","id":"</xsl:text>
      <xsl:value-of select="@id" />
      <xsl:text>","title":"</xsl:text>
      <xsl:value-of select="@title" />
      <xsl:text>","x":"</xsl:text>
      <xsl:value-of select="./coord/@x" />
      <xsl:text>","y":"</xsl:text>
      <xsl:value-of select="./coord/@y" />
      <xsl:text>","z":"</xsl:text>
      <xsl:value-of select="./coord/@z" />
      <xsl:text>"}</xsl:text>
      <xsl:choose>
        <xsl:when test="position() != last()">
          <xsl:text>,</xsl:text>
        </xsl:when>
      </xsl:choose>
    </xsl:for-each>
    <xsl:text>},"room_keys":[</xsl:text>
    <xsl:for-each select="/map/rooms/room">
      <xsl:text>"</xsl:text>
      <xsl:value-of select="@id" />
      <xsl:text>"</xsl:text>
      <xsl:choose>
        <xsl:when test="position() != last()">,</xsl:when>
      </xsl:choose>
    </xsl:for-each>
    <xsl:text>]}</xsl:text>
  </xsl:template>
</xsl:stylesheet>