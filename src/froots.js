(function(){
  // Render a selectable list of fruit thumbnails and show the chosen image on the plate
  const fruits = [ 
    {key:'apple1', src:'../../images/froot/greenapple1.png', label:'Green Apple'},
    // {key:'apple1', src:'../../images/froot/apple1/greenapple1_r1_c1_processed_by_imagy.jpg', label:'Green Apple'},
    {key:'apple2', src:'../../images/froot/apple2.png', label:'Apple 2'},
    // {key:'apple2', src:'../../images/froot/apple2/apple2_r1_c1_processed_by_imagy.jpg', label:'Apple 2'},
    {key:'apple3', src:'../../images/froot/apple3.png', label:'Apple 3'},
    // {key:'apple3', src:'../../images/froot/apple3/apple3_r1_c1_processed_by_imagy.jpg', label:'Apple 3'},
    {key:'banana', src:'../../images/froot/banana.png', label:'Banana'},
    // {key:'banana', src:'../../images/froot/banana/banana_r1_c1_processed_by_imagy.jpg', label:'Banana'},
    {key:'pear', src:'../../images/froot/greenpear.png', label:'Pear'}
    // {key:'pear', src:'../../images/froot/pear/greenpear_r1_c1_processed_by_imagy.jpg', label:'Pear'}
  ];

  const list = document.getElementById('froot-list');
  const plate = document.getElementById('plate-image');
  if (!list || !plate) return;

  fruits.forEach(f => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'froot-thumb';
    b.title = f.label;
    const img = document.createElement('img');
    img.src = f.src;
    img.alt = f.label;
    img.width = 80;
    img.height = 80;
    b.appendChild(img);
    b.addEventListener('click', ()=>{
      // mark active
      list.querySelectorAll('.froot-thumb').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      // update plate image src
      plate.src = f.src;
      plate.alt = f.label + ' on plate';
    });
    list.appendChild(b);
  });
})();
