import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 120,
    fontWeight: 'bold',
  },
  text: {
    flex: 1,
  },
});

function PDFDocument({ moteInfo, deltakere, agendaPunkter, status, statusOppnadd, nyDato }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Møtereferat</Text>
          <Text style={styles.subtitle}>{moteInfo.tema}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Møteinformasjon</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Dato og tid:</Text>
            <Text style={styles.text}>
              {new Date(moteInfo.dato).toLocaleDateString()} kl. {moteInfo.startTid}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Møteeier:</Text>
            <Text style={styles.text}>{moteInfo.eier}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Referent:</Text>
            <Text style={styles.text}>{moteInfo.referent}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deltakere</Text>
          {deltakere.map((deltaker, index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.text}>
                {deltaker.navn} ({deltaker.fagFunksjon})
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agenda</Text>
          {agendaPunkter.map((punkt, index) => (
            <View key={index} style={{ marginBottom: 10 }}>
              <View style={styles.row}>
                <Text style={styles.label}>Tid:</Text>
                <Text style={styles.text}>{punkt.tid}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Punkt:</Text>
                <Text style={styles.text}>{punkt.punkt}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Ansvarlig:</Text>
                <Text style={styles.text}>{punkt.ansvarlig}</Text>
              </View>
              {punkt.kommentar && (
                <View style={styles.row}>
                  <Text style={styles.label}>Kommentar:</Text>
                  <Text style={styles.text}>{punkt.kommentar}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Måloppnåelse:</Text>
            <Text style={styles.text}>
              {statusOppnadd === 'oppnadd' ? 'Oppnådd' : 
               statusOppnadd === 'ikke_oppnadd' ? 'Ikke oppnådd' : 
               'Ikke vurdert'}
            </Text>
          </View>
          {statusOppnadd === 'ikke_oppnadd' && nyDato && (
            <View style={styles.row}>
              <Text style={styles.label}>Ny dato:</Text>
              <Text style={styles.text}>{nyDato}</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}

export default PDFDocument; 