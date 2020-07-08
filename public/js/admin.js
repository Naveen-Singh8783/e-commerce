
const deleteItem = (btn) => {
     const prodId = btn.parentNode.querySelector('[name = productId ]').value;
    const csrf = btn.parentNode.querySelector('[name = _csrf ]').value;
    console.log('/admin/product/' + prodId);
    const productRemove = btn.closest('article');
    console.log(btn.closest('article'));
     fetch('/admin/product/' + prodId, {
        method: 'DELETE',
        headers: {
            'csrf-token' : csrf
        }
    })
    .then(result => {
        return result.json();
    })
    .then(data => {
        productRemove.parentNode.removeChild(productRemove);
    })
    .catch(err => console.log(err));
    
} 