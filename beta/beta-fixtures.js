/* Fictional beta records only. Never load customer data into this public test build. */
const BETA_SEED = (() => {
 const common={phone:'555-0100',type:'Wedding',date:'2027-06-12',due:'2027-05-29',total:1200,openingPaid:400,openingDate:'2026-10-01',openingMethod:'Cash',deposit:'Unknown',covers:false,projector:false,audio:false,bar:false,security:false,notes:'Fictional beta booking.',payments:[],imported:false,sheetBalance:null,importedDifference:0};
 return [
 {...common,id:'beta-alex',contract:'BETA-001',client:'Alex Sample'},
 {...common,id:'beta-jordan',contract:'BETA-002',client:'Jordan Example',type:'Birthday',date:'2027-07-17',total:800,openingPaid:800},
 {...common,id:'beta-review',contract:'BETA-003',client:'Casey Import Review',type:'Graduation',date:'2027-08-14',total:null,openingPaid:300,openingDate:'',openingMethod:'Historical total',imported:true,sheetBalance:500,importedDifference:0},
 {...common,id:'beta-mismatch',contract:'BETA-004',client:'Morgan Balance Review',date:'2027-09-18',total:1000,openingPaid:500,openingDate:'',imported:true,sheetBalance:400,importedDifference:100},
 {...common,id:'beta-block',contract:'BETA-BLOCK',client:'Sample maintenance hold',date:'2027-10-09',type:'Blackout',total:0,openingPaid:0,openingDate:'',due:'',notes:'Fictional blocked date. Test release and restoration.'}
 ];
})();
