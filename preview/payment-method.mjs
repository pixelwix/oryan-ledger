export const paymentMethods=Object.freeze(['Cash','Card','Check','CashApp','Venmo','Zelle']);
export function togglePaymentMethod(current,choice){return paymentMethods.includes(choice)?(current===choice?'':choice):current;}
